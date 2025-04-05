import datetime
from django.shortcuts import render
from django.http import JsonResponse
import requests
import urllib


def log_view(request):
    return render(request, 'logs.html', {})

def dashboard_view(request):
    return render(request, 'dashboard.html', {})
    
def correlation_view(request):
    return render(request, 'correlation.html', {})

def fetch_logs(request):
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    collection_name = request.GET.get('collection_name', 'vpc_logs_collection')
    search_query = request.GET.get('search', None) 
    start_date = request.GET.get('start_date', None) 
    end_date = request.GET.get('end_date', None) 

    try:
        page = int(page)
        page_size = int(page_size)
    except ValueError:
        return JsonResponse({"error": "Invalid page or page_size values. They must be integers."}, status=400)

    fastapi_url = f'http://fastapi:8000/raw-logs/?page={page}&page_size={page_size}&collection_name={collection_name}'
    
    if search_query:
        fastapi_url += f'&search={search_query}'

    if start_date :
        fastapi_url += f'&start_date={start_date}'

    if end_date : 
        fastapi_url += f'&end_date={end_date}'

    try:
        response = requests.get(fastapi_url)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Error fetching logs from FastAPI: {str(e)}"}, status=500)

    return JsonResponse(data, safe=False)

def fetch_correlation(request):
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)

    try:
        page = int(page)
        page_size = int(page_size)
    except ValueError:
        return JsonResponse({"error": "Invalid page or page_size values. They must be integers."}, status=400)

    fastapi_url = f'http://fastapi:8000/correlation/?page={page}&page_size={page_size}'

    try:
        response = requests.get(fastapi_url)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Error fetching logs from FastAPI: {str(e)}"}, status=500)

    return JsonResponse(data, safe=False)




def format_date_to_iso_with_offset_and_encode(date_string):
    # Parse the input string to a datetime object
    date = datetime.fromisoformat(date_string)
    
    # Set the UTC+7 offset
    offset = "+07:00"
    
    # Format the datetime object to the desired string format
    formatted_date = date.strftime(f"%Y-%m-%dT%H:%M:00{offset}")
    
    # URL encode the formatted date string
    encoded_date = urllib.parse.quote(formatted_date)
    
    return encoded_date