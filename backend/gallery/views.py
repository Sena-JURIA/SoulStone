import os
import io
import json
import uuid
import requests

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View

from rest_framework import status
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response

from azure.storage.blob import BlobServiceClient
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from msrest.authentication import CognitiveServicesCredentials

from .models import Photo
from .serializers import PhotoSerializer

from django.shortcuts import get_object_or_404
from django.shortcuts import render

from dotenv import load_dotenv
load_dotenv()

AZURE_STORAGE_ACCOUNT_NAME = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
AZURE_STORAGE_KEY = os.getenv("AZURE_STORAGE_KEY")
AZURE_STORAGE_CONTAINER = "photos" 

AZURE_AI_VISION_KEY = os.getenv("AZURE_AI_VISION_KEY")
AZURE_AI_VISION_ENDPOINT = os.getenv("AZURE_AI_VISION_ENDPOINT")
computervision_client = ComputerVisionClient(AZURE_AI_VISION_ENDPOINT, CognitiveServicesCredentials(AZURE_AI_VISION_KEY))

def photo_upload(request):
    return JsonResponse({'message': 'Image uploaded successfully'}, status=201)

@api_view(['GET','PUT','DELETE'])
@parser_classes([JSONParser])
def photo_detail(request, image_id):
    photo = get_object_or_404(Photo, pk=image_id)
    if request.method == 'GET':
        serializer = PhotoSerializer(photo)
        return JsonResponse(serializer.data)

    elif request.method == 'PUT':
        serializer = PhotoSerializer(photo, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- Blob Storage Service ---
def get_blob_service_client():
    connect_str = f"DefaultEndpointsProtocol=https;AccountName={AZURE_STORAGE_ACCOUNT_NAME};AccountKey={AZURE_STORAGE_KEY};EndpointSuffix=core.windows.net"
    return BlobServiceClient.from_connection_string(connect_str)

# --- 画像アップロードとタグ付け API ---
@method_decorator(csrf_exempt, name='dispatch')
class PhotoUploadView(View):
    def post(self, request, *args, **kwargs):
        print("--- リクエストを受け付けました ---")
        if 'image' not in request.FILES:
            return JsonResponse({'error': 'No image file found'}, status=400)

        title = request.POST.get('title', '無題')
        image_file = request.FILES['image']
        image_bytes = image_file.read()
        
        try:
            print("--- Blob Storage へのアップロードを開始 ---")
            blob_service_client = get_blob_service_client()
            container_client = blob_service_client.get_container_client(AZURE_STORAGE_CONTAINER)
            blob_name = f"{uuid.uuid4()}.{image_file.name.split('.')[-1]}"
            blob_client = container_client.get_blob_client(blob_name)
            
            blob_client.upload_blob(image_bytes)
            image_url = blob_client.url
            print(f"アップロード成功！URL: {image_url}")
        except Exception as e:
            print(f"!!! Blob Storage アップロード失敗: {str(e)}")
            return JsonResponse({'error': f'Blob Storage upload failed: {str(e)}'}, status=500)
            
        try:
            print("--- AI Vision でのタグ付けを開始 ---")
            image_stream = io.BytesIO(image_bytes)
            tags_result = computervision_client.tag_image_in_stream(image_stream, language='ja')
            
            if tags_result.tags:
                tags = ','.join([tag.name for tag in tags_result.tags])
                print(f"AI Vision タグ付け成功！タグ: {tags}")
            else:
                print(f"!!! AI Vision タグ付け失敗: {str(e)}")
                tags = 'タグなし'

        except Exception as e:
            return JsonResponse({'error': f'AI Vision tagging failed: {str(e)}'}, status=500)

        try:
            print("--- データベースへの保存を開始 ---")
            photo_data = {
                'title': title,
                'image': image_url,
                'tags': tags,
            }
            serializer = PhotoSerializer(data=photo_data)
            if serializer.is_valid():
                serializer.save()
                print(f"データベースに保存成功！データ: {serializer.data}")
                return JsonResponse(serializer.data, status=201)
            else:
                print(f"!!! データベース保存失敗: {serializer.errors}")
                return JsonResponse(serializer.errors, status=400)
        except Exception as e:
            print(f"!!! データベース保存失敗 (例外): {str(e)}")
            return JsonResponse({'error': f'Database save failed: {str(e)}'}, status=500)

@api_view(['GET'])
@parser_classes([JSONParser])
def photo_list(request):
    photos = Photo.objects.all().order_by('-created_at')
    serializer = PhotoSerializer(photos, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['POST'])
@parser_classes([JSONParser])
@csrf_exempt

def photo_retag(request, image_id):
    try:
        photo = get_object_or_404(Photo, pk=image_id)
        
        # Azure AI Visionで画像を再解析
        image_stream = io.BytesIO(requests.get(photo.image).content)
        tags_result = computervision_client.tag_image_in_stream(image_stream, language='ja')

        if tags_result.tags:
            new_tags = ','.join([tag.name for tag in tags_result.tags])
        else:
            new_tags = 'タグなし'
        
        # データベースを更新
        photo.tags = new_tags
        photo.save()
        
        serializer = PhotoSerializer(photo)
        return JsonResponse(serializer.data)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)