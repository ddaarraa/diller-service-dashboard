from django.shortcuts import render

def table_view(request):
    return render(request, "table.html")
