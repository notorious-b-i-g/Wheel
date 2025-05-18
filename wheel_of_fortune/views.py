import random
import json
import hmac
import hashlib
from urllib.parse import unquote
import os
import requests
from dotenv import load_dotenv


from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.contrib.auth.decorators import login_required

from .models import Prize, Spin, Users

load_dotenv()

bot_token = os.getenv("BOT_TOKEN")


def start_screen(request):
    print('start_screen')
    return render(request, 'wheel_of_fortune/start.html')


def check_user(request):
    username = request.GET.get('userId')
    user_telegram_name = request.GET.get('username')
    user, created = Users.objects.get_or_create(user=username)

    init_data = request.headers.get('X-Init-Data')
    if init_data and validate_init_data(init_data, bot_token):
        request.session['is_verified'] = True

    if not created:
        print('Не создано')
        request.session['username'] = username
        request.session['usertelegramname'] = user_telegram_name
        return JsonResponse({
            'success': True,
            'redirect_url': f'/wheel/?username={username}&usertelegramname={user_telegram_name}'
        })
    else:
        print('создано')
        user.telegram_name = user_telegram_name
        user.save()
        return JsonResponse({'success': False, 'message': 'Пользователь не найден'}, status=404)


def main_view(request):
    # if not request.session['is_verified']:
    #     return
    username = request.GET.get('username')
    # user_profile = Users.objects.get(user=username)
    # request.session['username'] = user_profile.user
    user_profile = Users.objects.all()[0]
    moderator_tg = os.getenv("MODERATOR")
    recent_spins = Spin.objects.order_by('-timestamp')[:10]
    prizes = Prize.objects.all()

    prizes_list = []
    for prize in prizes:
        prizes_list.append({
            'id': prize.id,
            'name': prize.name,
            'description': prize.description,
            'checked': prize.checked,
            'prize_type': prize.prize_type,
            'money_amount': float(prize.money_amount or 0),
            'freespin_amount': prize.freespin_amount or 0,
            'image_url': prize.image.url if prize.image else ''
        })

    prizes_json = json.dumps(prizes_list, ensure_ascii=False)
    moderator_username = moderator_tg.split('/')[3]
    return render(request, 'wheel_of_fortune/main.html', {
        'user_profile': user_profile,
        'recent_spins': recent_spins,
        'prizes_json': prizes_json,
        'moderator_tg': moderator_tg,
        'moderator': moderator_username
    })


def spin_wheel(request):

    if request.method != 'POST':
        return JsonResponse({'error': 'Неверный метод запроса.'}, status=405)

    username = request.session.get('username')
    user_profile = Users.objects.all()[0]

    # user_profile = Users.objects.order_by('id').first()

    if user_profile.available_spins < 1:
        return JsonResponse({'error': 'Нет доступных вращений.'}, status=400)

    prizes = Prize.objects.all()
    if not prizes:
        return JsonResponse({'error': 'Призы не настроены.'}, status=400)

    total_probability = sum(prize.probability for prize in prizes)
    if total_probability <= 0:
        return JsonResponse({'error': 'Неверная конфигурация вероятностей.'}, status=400)

    rand = random.uniform(0, total_probability)
    cumulative = 0
    selected_prize = None
    selected_index = None

    for index, prize in enumerate(prizes):
        cumulative += prize.probability
        if rand <= cumulative:
            selected_prize = prize
            selected_index = index
            break

    if not selected_prize:
        selected_prize = prizes[-1]
        selected_index = len(prizes) - 1

    Spin.objects.create(user=user_profile, prize=selected_prize)

    user_profile.available_spins -= 1
    if selected_prize.prize_type == 'freespin':
        user_profile.available_spins += selected_prize.freespin_amount
    else:
        send_spin_api(selected_prize.name, user_profile.user)
    user_profile.save()

    prize_image_url = selected_prize.image.url if selected_prize.image else ''

    return JsonResponse({
        'prize_id': selected_prize.id,
        'prize_name': selected_prize.name,
        'prize_description': selected_prize.description,
        'prize_type': selected_prize.prize_type,
        'money_amount': float(selected_prize.money_amount or 0),
        'freespin_amount': selected_prize.freespin_amount or 0,
        'prize_image': prize_image_url,
        'available_spins': user_profile.available_spins,
        'balance': float(user_profile.balance),
        'selected_index': selected_index,
    })


def send_spin_api(prize_name, user_id):
    api_url = os.getenv("API_URL")
    data = {
        "product_id": prize_name,
        "telegram_id": user_id
    }
    headers = {"Content-Type": "application/json"}


    try:
        response = requests.post(api_url, json=data, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        pass
def get_refer_bonus(request):
    username = request.session.get('username')
    user = Users.objects.get(user=username)
    refer_id = request.POST.get('refer_code')
    try:
        inviter_user = Users.objects.get(referal_code=str(refer_id))
    except:
        inviter_user = None

    if inviter_user:
        user.available_spins += 1
        inviter_user.invited_users += 1

        user.save()
        inviter_user.save()
        return JsonResponse(
            {'success': True, 'message': 'Реферальный код успешно активирован!'})
    else:
        return JsonResponse(
            {'success': False, 'message': 'Такого кода нет!'})

def validate_init_data(init_data: str, bot_token: str):
    try:
        # Разбираем init_data вида "query_id=AAHMh&user=%7B..."
        vals_raw = [s.split('=', 1) for s in init_data.split('&') if '=' in s]
        vals = {k: unquote(v) for k, v in vals_raw}
    except:
        return False

    data_check_string = '\n'.join(
        f"{k}={v}" for k, v in sorted(vals.items()) if k != 'hash'
    )
    secret_key = hmac.new("WebAppData".encode(), bot_token.encode(), hashlib.sha256).digest()
    h = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256)
    return h.hexdigest() == vals.get('hash', '')
