# 2-factor security 스마트 도어락 **< Voicedoor >**
## 📒 프로젝트 소개

화자인증과 일회용 비밀번호(OTP)를 결합한 다요소 인증 방식을 이용해 비밀번호 복제 위험을 줄이고 보안을 강화한다. 
사전에 서버에 인증된 모바일 기기는 블루투스 통신을 통해 곧바로 도어락을 제어하게 함으로써 보안 뿐 아니라 사용자의 편의성도 고려했다.

* 개발 기간 : 2018.01 ~2018.09 (9개월)
* 개발 인원 : 3명(Android, 서버, 아두이노)
* 기획 의도
  + 문제점
    1. 숙박 공유 서비스 시장이 확장됨에 따라 사업자가 아니더라도 쉽게 숙박을 제공하는 공급자가 되는 것이 가능해졌으나 그에 반해 방문자는 숙박 제공자가 제공하는 잠금장치의 관리 및 운영 방식을 신뢰할 방법이 없다.
    2. 공급자 역시 방문자의 방문 이후 잠금장치를 물리적(비밀번호 변경이나 도어락 재설치 등)으로 변경하지 않는 한, 이전 방문자가 공급자 몰래 침입하는 것을 막을 수 없다.
  + 기대효과
    1. 숙박 제공자도 임의로 수정할 수 없는 음성을 이용한 화자 인식과 일회용 비밀번호 두 요소를 병합하여 사용한 잠금장치를 제안함으로써 사용자 접근 권한을 안전하게 유지할 수 있다.
    2. 가정부나 설치기사 등 집주인이 없지만 한시적으로 출입이 허용된 방문자가 존재하는 경우, 비밀번호를 공유하는 것보다 보안을 강화할 수 있다.
    3. 일회성 비밀번호(OTP)의 사용으로 비밀번호가 노출된 경우에도 replay attack을 방지할 수 있다.

## 📸 결과물

<img width="34%" alt="스크린샷 2021-03-07 오후 5 08 31" src="https://user-images.githubusercontent.com/24769585/110233576-22acac00-7f68-11eb-8540-bcb4970589df.png"> <img width="35%" alt="스크린샷 2021-03-07 오후 5 08 47" src="https://user-images.githubusercontent.com/24769585/110233573-204a5200-7f68-11eb-87a7-3b505ec1fa63.png"> <img width="30%" alt="스크린샷 2021-03-07 오후 5 09 04" src="https://user-images.githubusercontent.com/24769585/110233565-1c1e3480-7f68-11eb-9732-0c40f66ed3a3.png">

* 시연영상
 [  >> google drive ](https://drive.google.com/file/d/1IyVHUJxvlp3WB3QIibozw1mPk3VmvLr0/view?usp=sharing)

## 💻 사용 기술

#### SW
* OS : Raspbian Jessie
* 개발환경(IDE) : Android Studio, Arduino
* 개발도구 : Node.js
* 개발 언어 : Java, javascript, c++
* 기타 : Node.js, npm, pm2, mysql, retrofit2.0, Microsoft Azure Speaker Recognition API, adrielcafe-AndroidAudioRecorder, jwt(HS256), mosquitto

#### Hw
* 디바이스 : Raspberry Pi 3 (server), Arduino Uno / WeMos d1 r1 (doorlock)
* 모듈 : 릴레이 / 블루투스 / esp-01(와이파이)
* 통신 : WiFi, BLE, MQTT
* 개발 언어 : python3, C++
* 기타 : 12v / 1.5v 8 / lcd I2C / 4x4

#### 프로젝트 관리 환경
* git, Github, Trello

## 🛠주요 기능
* 화자인증 잠금해제 기능 : 등록된 사용자의 음성을 인증하여 잠금해제
* 일회용 비밀번호 발급 : 화자 인증 후 일회용 비밀번호 발급
* 블루투스 잠금해제 : 도어락과 사용자의 일정거리 내에서 원격으로 잠금해제
* 출입기록 관리 : 출입과 출입 시도를 DB화하여 저장
* 라즈베리파이 서버 구축:  안드로이드 앱과 아두이노를 제어하는 라즈베리파이 홈서버 구현
* 아두이노 도어락 구현 : 잠금장치 역할을 하는 솔레노이드 LCD, 4X4 키패드 등을 이용하여 도어락 구현

## ⭐️프로젝트를 마치며
라즈베리파이를 서버로 구축하면서 안드로이드 어플리케이션과 HTTP 통신, 아두이노와의 MQTT 통신 두 부분을 구현해야 헀다. HTTP 요청과 응답 처리는 Node.js로 REST API를 작성하여 어렵지 않게 구현했는데 이후 그 위에 MQTT요청과 응답 처리를 작성하는 과정에서 Node.js코드에서 MQTT로 구독하는 특정 토픽을 인식하지 못하거나 또 다른 토픽에서 받은 메시지가 무한으로 받아지는 오류가 있었다. 이 오류들은 기능별로 받는 토픽을 정확하게 구별하고, 토픽 별로 나누어 테스트를 진행하는 방식으로 해결했다. MQTT 프로토콜에 익숙하지 않은 탓도 있었지만, 기본적으로 설계를 꼼꼼히 하지 못한 탓이었다. 설계 과정에 충분한 시간을 두지 못해 구현이나 테스트 과정에서 더 많은 시간을 할애할 수 있다는 것을 몸소 경험했다. 또한 여러 프로토콜의 요청/응답 처리를 함께 다루어 볼 기회가 많지 않았는데 그런 측면에서 이번 프로젝트가 좋은 경험이 되었다.
