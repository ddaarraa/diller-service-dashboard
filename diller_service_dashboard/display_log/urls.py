from django.urls import path
from . import views

urlpatterns = [
    path('', views.log_view, name='logs'),  
    path('fetch-logs/', views.fetch_logs, name='fetch_logs'), 
]
