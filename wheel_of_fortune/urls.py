# wheel_of_fortune/urls.py

from django.urls import path
from . import views

app_name = 'wheel_of_fortune'

urlpatterns = [
    path('', views.start_screen, name='start'),
    path('wheel/', views.main_view, name='main'),
    path('spin/', views.spin_wheel, name='spin_wheel'),
    path('check_user_exist/', views.check_user, name='check_user'),
    path('input_refer/', views.get_refer_bonus, name='get_refer_bonus')
]
