# NGL APP [anonymous-messaging-app]
* send anonymous messages or public messages.
* view profile with related messages.
* handle manage messages.


- tech stack:
    - express
    - javascript 
    - mongodb/mongoose
    - redis [caching]
    - nodemailer [email]
    - jwt [ authentication]
    - bcrypt [password hash]
    - oauth2 [google]
    - validation [Zod,joi,Yup,class-validator]
    - error handling [AppError]
    - rate limiting. [nginx]
    - load balancer. [nginx]

- OTP:
    - delete OTP after 10 min.
    - delete OTP after usage.
    - store OTP temporarily:[time to live]
         - database using mongodb support TTL.[HDD]
         - into cache redis support TTL.[ram] x50 faster more DB.56y65y 
- TODO:
    -  link:
       - verify email:
         - /api/v1/auth/verify-email/:token
       - login:
         - /api/v1/auth/login

- features:
  - authentication flow:
     - register.
     - verify email using OTP.
     - login.
     - reset password.
     - send OTP.
     - login with Google.
     - logout.
  - message flow:
     - send a message. [anonymous - public]
     - view message.
     - delete message. [soft-delete/archive]
  - user flow [me]:
     - view profile.[me]
     - edit profile.[me]
     - delete profile.[me]
  - guards:
     - authentication.[token]


* todo session1:

- register.
- send email [nodemailer]
- generate OTP.

=================================

* todo Session2:

- refactor send email.
- login and pass token using cookie.
- verify an account switch isVerified to true.
- resend otp.[in-case otp expired, in-case reset password]
- reset password.