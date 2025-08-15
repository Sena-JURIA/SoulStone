from django.db import models

class Photo(models.Model):
    title = models.CharField(max_length=200)
    image = models.CharField(max_length=500)
    tags = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title