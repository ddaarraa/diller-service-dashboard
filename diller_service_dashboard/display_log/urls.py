from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard_view, name='dashboard'),  
    path('log-display/', views.log_view, name='logs'),  
    path('fetch-logs/', views.fetch_logs, name='fetch_logs'),
    path('fetch-log-by-id/', views.fetch_log_by_id, name='fetch_log_by_id'),
    path('log-correlation/', views.correlation_view, name='logs_correlation'),
    path('fetch-correlation/', views.fetch_correlation, name='fetch_correlation')
    
]
