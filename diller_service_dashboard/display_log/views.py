from django.core.paginator import Paginator
from django.shortcuts import render

def log_view(request):
    logs = [
        {"time": {"$date": "2025-02-19T15:16:39.000Z"}, "message": "VPC Log Entry 1", "log_type": "vpc"},
        {"time": {"$date": "2025-02-20T10:15:20.000Z"}, "message": "Sys Log Entry 2", "log_type": "sys"},
        {"time": {"$date": "2025-02-21T11:30:45.000Z"}, "message": "App Log Entry 3", "log_type": "app"},
        # Add more logs for testing (20+ logs for pagination)
    ]

    log_type = request.GET.get("log_type", "vpc")  # Default to VPC logs
    filtered_logs = [log for log in logs if log["log_type"] == log_type]  

    paginator = Paginator(filtered_logs, 10)  # Show 10 logs per page
    page_number = request.GET.get("page", 1)
    page_obj = paginator.get_page(page_number)

    return render(request, "logs.html", {"logs": page_obj, "log_type": log_type, "page_obj": page_obj})
