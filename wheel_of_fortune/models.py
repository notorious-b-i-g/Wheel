from django.db import models

class Prize(models.Model):
    PRIZE_TYPES = (
        ('money', 'Деньги'),
        ('freespin', 'Фриспины'),
        ('product', 'Товар'),
        ('vpn', 'VPN'),
    )

    name = models.CharField(max_length=100, verbose_name="Название приза")
    description = models.TextField(blank=True, verbose_name="Описание приза")
    probability = models.FloatField(default=0.0, verbose_name="Вероятность выпадения")
    image = models.ImageField(upload_to='prizes/', blank=True, null=True, verbose_name="Изображение приза")
    checked = models.BooleanField(default=False, verbose_name="Редкий")

    prize_type = models.CharField(
        max_length=20,
        choices=PRIZE_TYPES,
        default='product',
        verbose_name="Тип приза"
    )
    money_amount = models.IntegerField(
        default=0,
        verbose_name="Сумма денег"
    )
    freespin_amount = models.PositiveIntegerField(
        default=0,
        verbose_name="Кол-во фриспинов",
        blank=True,
        null=True
    )

    def __str__(self):
        return self.name


class Users(models.Model):
    user = models.CharField(max_length=255, verbose_name="Пользователь")
    invited_users = models.PositiveIntegerField(default=0, verbose_name="Количество приглашенных пользователей")

    available_spins = models.PositiveIntegerField(default=0, verbose_name="Доступные вращения")

    balance = models.IntegerField(default=0, verbose_name="Баланс")
    referral_code = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.user


class Spin(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE, verbose_name="Пользователь")
    prize = models.ForeignKey(Prize, on_delete=models.SET_NULL, null=True, verbose_name="Выпавший приз")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Дата и время вращения")

    def __str__(self):
        return f"{self.user} - {self.prize.name} - {self.timestamp}"
