window.addEventListener('load', function () {
    console.log('wheel.js загружен и выполняется');
    document.getElementById("preloader").style.display = "none";

    const wheelContainer = document.querySelector('.wheel-container');
    const csrfToken = wheelContainer ? wheelContainer.dataset.csrf : null;
    const prizesElement = document.getElementById('prizes-data');
    const spinsAvailableElement = document.getElementById('spinsAvailable');

    const prizeWonDiv = document.getElementById('prizeWonDiv');
    const prizeWonDescription = document.getElementById('prizeWonDescription');
    const prizeWinImage = document.getElementById('prize_win_image');
    const writeToButton = document.getElementById('write_to_admin_button');

    const inviteFriendDiv = document.getElementById('invite_friend_div');
    const inputReferDiv = document.getElementById('input_refer_div');
    const spinButton = document.getElementById('spinButton');
    const noSpinsDiv = document.getElementById('noSpinsDiv');
    const noSpinsButton = document.getElementById('close_no_spins_button');

    // Иконка звука
    let isSoundEnabled = true;
    const soundToggleIcon = document.getElementById('soundToggleIcon');
    if (soundToggleIcon) {
        soundToggleIcon.addEventListener('click', () => {
            isSoundEnabled = !isSoundEnabled;
            if (isSoundEnabled) {
                soundToggleIcon.src = "/static/wheel_of_fortune/images/unmute_icon.svg";
                soundToggleIcon.alt = "Sound On";
            } else {
                soundToggleIcon.src = "/static/wheel_of_fortune/images/mute_icon.svg";
                soundToggleIcon.alt = "Sound Off";
            }
            console.log('isSoundEnabled =', isSoundEnabled);
        });
    }

    if (noSpinsButton) {
        noSpinsButton.addEventListener('click', () => {
            toggleVisibility(null, noSpinsDiv);
        });
    }

    if (!prizesElement) {
        console.error('Элемент #prizes-data не найден. Прерываем выполнение wheel.js');
        return;
    }
    if (!spinsAvailableElement) {
        console.error('Элемент #spinsAvailable не найден. Прерываем выполнение wheel.js');
        return;
    }
    if (!spinButton) {
        console.error('Кнопка #spinButton не найдена. Прерываем выполнение wheel.js');
        return;
    }

    let prizes;
    try {
        prizes = JSON.parse(prizesElement.textContent);
    } catch (err) {
        console.error('Ошибка парсинга JSON в элементе #prizes-data:', err);
        return;
    }

    if (!Array.isArray(prizes) || prizes.length === 0) {
        console.error('Призы не определены или массив призов пуст');
        return;
    }

    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) {
        console.error('#wheelCanvas не найден. Прерываем скрипт.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 10;
    let currentAngle = 0;
    let isSpinning = false;

    const numSegments = prizes.length;
    const segmentAngle = 360 / numSegments;
    const colors = prizes.map((prize, index) => {
        // Для "checked" приза - #333333, иначе чёредуем красный и белый
        if (prize.checked) {
            return '#333333';
        } else {
            return (index % 2 === 0) ? '#FF0000' : '#FFFFFF';
        }
    });

    // Загружаем изображения призов
    const images = [];
    let imagesLoaded = 0;

    prizes.forEach((prize, index) => {
        if (prize.image_url) {
            const img = new Image();
            img.src = prize.image_url;
            img.onload = () => {
                imagesLoaded++;
                if (imagesLoaded === numSegments) {
                    drawWheel(currentAngle);
                }
            };
            img.onerror = () => {
                console.error(`Ошибка загрузки изображения для приза: ${prize.name}`);
                imagesLoaded++;
                if (imagesLoaded === numSegments) {
                    drawWheel(currentAngle);
                }
            };
            images.push(img);
        } else {
            images.push(null);
            imagesLoaded++;
        }
    });

    if (imagesLoaded === numSegments) {
        drawWheel(currentAngle);
    }

    function drawWheel(angle = 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle * Math.PI / 180);

        for (let i = 0; i < numSegments; i++) {
            const startAngle = (i * segmentAngle) * Math.PI / 180;
            const endAngle = ((i + 1) * segmentAngle) * Math.PI / 180;

            let gradient = ctx.createRadialGradient(0, 0, outerRadius * 0.65, 0, 0, outerRadius);

            if (colors[i] === '#FF0000') {
                gradient.addColorStop(0, '#FF0000');
                gradient.addColorStop(1, '#a30000');
            } else if (colors[i] === '#FFFFFF') {
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(1, '#bababa');
            } else {
                gradient.addColorStop(0, '#333333');
                gradient.addColorStop(1, '#1a1a1a');
            }

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, outerRadius, startAngle, endAngle, false);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = 'rgb(255,231,212)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Текст приза
            const isRare = prizes[i].checked;
            const segmentColor = colors[i];
            const textColor = (segmentColor === '#FF0000' || isRare) ? '#FFFFFF' : '#000000';

            ctx.save();
            const midAngle = (startAngle + endAngle) / 2;
            ctx.translate(
                Math.cos(midAngle) * outerRadius * 0.65,
                Math.sin(midAngle) * outerRadius * 0.65
            );
            ctx.rotate(midAngle);

            ctx.fillStyle = textColor;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const prizeName = prizes[i].name;
            ctx.fillText(prizeName, 0, 0);
            ctx.restore();
        }

        ctx.restore();
    }

    // Звуки
    const spinSound = document.getElementById('spinSound');
    const winSound = document.getElementById('winSound');

    function playSpinSound() {
        if (spinSound && !isSoundEnabled) {
            spinSound.currentTime = 0;
            spinSound.play().catch(err => console.error('spinSound play error:', err));
        }
    }

    function playWinSound() {
        if (winSound && !isSoundEnabled) {
            winSound.currentTime = 0;
            winSound.play().catch(err => console.error('winSound play error:', err));
        }
    }

    spinButton.addEventListener('click', function () {
        console.log('Нажали кнопку "Вращать"');
        if (isSpinning) {
            alert('Колесо уже вращается!');
            return;
        }

        // Проверяем кол-во оставшихся вращений
        const currentSpinsText = spinsAvailableElement.innerText;
        const currentSpinsMatch = currentSpinsText.match(/(\d+)/);
        const currentSpins = currentSpinsMatch ? parseInt(currentSpinsMatch[1], 10) : 0;

        if (currentSpins < 1) {
            toggleVisibility(noSpinsDiv, noSpinsDiv);
            return;
        }

        // Сразу уменьшаем счётчик на экране
        spinsAvailableElement.innerText = `Доступные вращения: ${currentSpins - 1}`;

        isSpinning = true;
        playSpinSound();

        // Запрашиваем приз
        fetch('/spin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken
            },
            body: 'source=invitation'
        })
        .then(resp => resp.json())
        .then(data => {
            if (data.error) {
                // Если ошибка — возвращаем спин обратно
                spinsAvailableElement.innerText = `Доступные вращения: ${currentSpins}`;
                toggleVisibility(noSpinsDiv, noSpinsDiv);
                isSpinning = false;
                return;
            }

            // Определяем нужный сектор
            const selectedIndex = data.selected_index;
            if (selectedIndex < 0 || selectedIndex >= numSegments) {
                console.error('selected_index выходит за допустимый диапазон:', selectedIndex);
                spinsAvailableElement.innerText = `Доступные вращения: ${currentSpins}`;
                isSpinning = false;
                return;
            }

            const prizeAngle = 360 / numSegments;
            const sectorStart = selectedIndex * prizeAngle;
            const randomOffset = Math.random() * prizeAngle;
            const targetSectorAngle = sectorStart + randomOffset;

            // Смещение на pointerOffset, чтобы указатель был сверху
            const pointerOffset = 90;
            const adjustedTargetAngle = (targetSectorAngle + pointerOffset) % 360;
            const stopAngle = 360 - adjustedTargetAngle;

            const spinsFull = 6; // Сколько полных оборотов до остановки
            const totalAngle = spinsFull * 360 + stopAngle;

            spinToAngle(totalAngle, 5, data);  // 5 секунд
            setTimeout(playWinSound, 5000);

        })
        .catch(err => {
            console.error('Ошибка при /spin/:', err);
            // Возвращаем спин обратно
            spinsAvailableElement.innerText = `Доступные вращения: ${currentSpins}`;
            alert('Произошла ошибка при обработке вращения.');
            isSpinning = false;
        });
    });

    function spinToAngle(targetAngle, duration, spinResult) {
        const startAngle = currentAngle % 360;
        let difference = targetAngle - startAngle;
        if (difference < 0) {
            difference += 360;
        }

        const startTime = performance.now();

        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const easedProgress = easeOutQuad(progress);

            currentAngle = startAngle + difference * easedProgress;
            drawWheel(currentAngle);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Закончили анимацию
                isSpinning = false;
                currentAngle %= 360;

                // Обновляем число доступных вращений
                if (spinResult.available_spins !== undefined) {
                    spinsAvailableElement.innerText =
                        `Доступные вращения: ${spinResult.available_spins}`;
                }

                // Показать описание в prizeWonDiv
                if (spinResult.prize_description) {
                    prizeWonDescription.innerText = spinResult.prize_description;
                } else {
                    prizeWonDescription.innerText = '';
                }

                // Если есть картинка приза
                if (spinResult.prize_image) {
                    prizeWinImage.src = spinResult.prize_image;
                    prizeWinImage.style.display = 'block';
                } else {
                    prizeWinImage.style.display = 'none';
                }

                // Показывать кнопку «Написать» только при product
                if (spinResult.prize_type === 'product') {
                    writeToButton.classList.remove('hidden');
                } else {
                    writeToButton.classList.add('hidden');
                }

                // Открываем всплывающее окно
                toggleVisibility(prizeWonDiv, prizeWonDiv);
            }
        }

        requestAnimationFrame(animate);
    }

    function easeOutQuad(t) {
        return t * (2 - t);
    }

    // Кнопка «Скопировать»
    const inviteButton = document.getElementById('copy_refer_link_button');
    if (inviteButton) {
        const valueToCopy = inviteButton.getAttribute('data-copy-value') || '';
        inviteButton.addEventListener('click', () => {
            copyToClipBoard(valueToCopy);
            inviteButton.style.backgroundColor = "#E0E0E0";
            inviteButton.textContent = "Скопировано!";
        });
    }

    // Кнопка «Пригласить друга»
    const openInviteFriendButton = document.getElementById('invite_friend_button');
    if (openInviteFriendButton) {
        openInviteFriendButton.addEventListener('click', () => {
            toggleVisibility(inviteFriendDiv, inviteFriendDiv);
        });
    }

    // Закрыть «Пригласить друга»
    const closeInviteFriendButton = document.getElementById('close_invite_friend_button');
    if (closeInviteFriendButton) {
        closeInviteFriendButton.addEventListener('click', () => {
            toggleVisibility(null, inviteFriendDiv);
        });
    }

    // Ввести реферальный код
    const openInputReferButton = document.getElementById('input_refer_button');
    if (openInputReferButton) {
        openInputReferButton.addEventListener('click', () => {
            toggleVisibility(inputReferDiv, inputReferDiv);
        });
    }

    // Закрыть «Ввести реферальный код»
    const closeInputReferButton = document.getElementById('close_input_refer_button');
    if (closeInputReferButton) {
        closeInputReferButton.addEventListener('click', () => {
            toggleVisibility(null, inputReferDiv);
        });
    }

    // Закрыть окно выигрыша
    const closePrizeWonButton = document.getElementById('close_prize_won_button');
    if (closePrizeWonButton) {
        closePrizeWonButton.addEventListener('click', () => {
            toggleVisibility(null, prizeWonDiv);
        });
    }

    // Отправка реферального кода
    const sendReferCodeButton = document.getElementById('send_refer_code_button');
    const referIdText = document.getElementById('input_refer');

    sendReferCodeButton.addEventListener('click', function () {
        const referCode = referIdText.value.trim();
        if (!referCode) {
            alert('Введите реферальный код.');
            return;
        }

        fetch('/input_refer/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken
            },
            body: `refer_code=${encodeURIComponent(referCode)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Реферальный код успешно отправлен!');
            } else {
                alert(data.error || 'Ошибка отправки реферального кода.');
            }
        })
        .catch(error => {
            console.error('Ошибка при отправке реферального кода:', error);
            alert('Произошла ошибка. Попробуйте позже.');
        });
    });

    // Функция копирования
    function copyToClipBoard(value) {
        if (!value) return;
        navigator.clipboard.writeText(value)
            .then(() => {
                console.log("Скопировано в буфер: " + value);
            })
            .catch(err => {
                console.error("Ошибка копирования: ", err);
            });
    }

    // Показать один блок, скрыть другие
    function toggleVisibility(toShow, ...elements) {
        elements.forEach(element => {
            if (!element) return;
            if (element === toShow) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
    }
});

document.addEventListener('touchmove', function(event) {
  event.preventDefault();
}, { passive: false });

