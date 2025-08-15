from django.urls import path
from . import views

urlpatterns = [
    path('photos/', views.PhotoUploadView.as_view(), name='photo_upload'),
    path('photos/list/', views.photo_list, name='photo_list'),
    path('photos/<int:image_id>/retag/', views.photo_retag, name='photo_retag'),
    path('photos/<int:image_id>/', views.photo_detail, name='photo_detail'),
]