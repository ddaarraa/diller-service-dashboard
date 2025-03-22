from django.shortcuts import render
from django.http import JsonResponse
import requests

def log_view(request):
    return render(request, 'logs.html', {})

def fetch_logs(request):
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    collection_name = request.GET.get('collection_name', 'vpc_logs_collection')
    search_query = request.GET.get('search', None) 

    try:
        page = int(page)
        page_size = int(page_size)
    except ValueError:
        return JsonResponse({"error": "Invalid page or page_size values. They must be integers."}, status=400)

    fastapi_url = f'http://localhost:8001/raw-logs/?page={page}&page_size={page_size}&collection_name={collection_name}'
    
    if search_query:
        fastapi_url += f'&search={search_query}'

    try:
        response = requests.get(fastapi_url)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Error fetching logs from FastAPI: {str(e)}"}, status=500)

    return JsonResponse(data, safe=False)