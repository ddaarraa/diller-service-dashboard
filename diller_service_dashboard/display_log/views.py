from django.shortcuts import render
from django.http import JsonResponse
import requests

def log_view(request):
    return render(request, 'logs.html', {})

def fetch_logs(request):
    # Get query parameters
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    collection_name = request.GET.get('collection_name', 'vpc_logs_collection')
    search_query = request.GET.get('search', None)  # Get the search query

    # Validate page and page_size
    try:
        page = int(page)
        page_size = int(page_size)
    except ValueError:
        return JsonResponse({"error": "Invalid page or page_size values. They must be integers."}, status=400)

    # Build the FastAPI URL
    fastapi_url = f'http://localhost:8001/raw-logs/?page={page}&page_size={page_size}&collection_name={collection_name}'
    
    # Add the search query to the URL if provided
    if search_query:
        fastapi_url += f'&search={search_query}'

    try:
        # Make the request to FastAPI
        response = requests.get(fastapi_url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Error fetching logs from FastAPI: {str(e)}"}, status=500)

    return JsonResponse(data, safe=False)