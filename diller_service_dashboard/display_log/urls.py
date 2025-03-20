from django.urls import path
from . import views  

urlpatterns = [
    path("table/", views.log_view, name="log"), 
]
