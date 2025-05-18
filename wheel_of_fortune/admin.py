from django.contrib.admin import AdminSite
from .models import *
from django.contrib.contenttypes.models import ContentType
from django import forms
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth.models import Group, User
from django.contrib.auth.admin import GroupAdmin, UserAdmin



admin.site.register(Users)
admin.site.register(Prize)
admin.site.register(Spin)
