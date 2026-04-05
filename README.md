# Alumni Influencer Platform API

A comprehensive web-based API for an alumni influencer platform with blind bidding system, built using Node.js (Express) and MySQL.

## Features

### 🔐 Authentication & Security
- User registration with university domain validation
- Email verification with secure, expiring tokens
- Bcrypt password hashing (10 rounds)
- JWT Bearer token authentication
- Session management
- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes, stricter for auth endpoints)
- Input validation and sanitization (SQL injection & XSS prevention)

### 👤 Profile Management
- Complete user profiles with LinkedIn URL, bio, and profile image
- Education history (degrees, institutions, courses)
- Experience history (employment records)
- File upload for profile images

### 💰 Blind Bidding System
- Place bids for "Alumni of the Day" feature
- Increase bids without seeing competitors' bids (blind bidding)
- Monthly win limits (3 wins default, 4 if event attended)
- Automatic eligibility checking
- View only your own bid history

### ⏰ Automated Winner Selection
- Daily cron job runs at midnight
- Selects highest bidder for next day
- Automatic email notifications to winners
- Transaction-safe bid status updates

### 📚 API Documentation
- Swagger/OpenAPI documentation at `/api-docs`
- Interactive API testing interface

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd "g:\Final Year\LECS\Serverside\CW_1\CW_Express"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Edit the `.env` file with your configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=alumni_platform
   
   # Email (for verification)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   
   # University domain
   ALLOWED_DOMAINS=university.edu,alumni.university.edu
   ```

4. **Create the database**
   ```bash
   mysql -u root -p
   ```
   
   Then run:
   ```sql
   CREATE DATABASE alumni_platform;
   ```

5. **Import the database schema**
   ```bash
   mysql -u root -p alumni_platform < database/schema.sql
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

Once the server is running, visit:
```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/verify/:token` - Verify email
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/resend-verification` - Resend verification email

### Profile (Requires Authentication)
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/education` - Add education
- `PUT /api/profile/education/:id` - Update education
- `DELETE /api/profile/education/:id` - Delete education
- `POST /api/profile/experience` - Add experience
- `PUT /api/profile/experience/:id` - Update experience
- `DELETE /api/profile/experience/:id` - Delete experience

### Bidding (Requires Authentication)
- `POST /api/bidding/place` - Place a bid
- `PUT /api/bidding/increase/:bidId` - Increase bid
- `GET /api/bidding/my-bids` - Get your bids
- `GET /api/bidding/eligibility` - Check eligibility

## Database Schema

The database follows Third Normal Form (3NF) with the following tables:

- **users** - User authentication and core data
- **profiles** - Alumni profile information (1:1 with users)
- **education** - Educational background (1:N with users)
- **experience** - Employment history (1:N with users)
- **bids** - Blind bidding records
- **daily_winners** - Alumni of the Day winners
- **events** - Event information
- **event_attendance** - User-event attendance tracking
- **email_verification_tokens** - Secure verification tokens
- **sessions** - Session management

### Stored Procedures
- `count_monthly_wins()` - Count wins for a user in a month
- `attended_event_in_month()` - Check event attendance
- `get_monthly_limit()` - Get monthly win limit (3 or 4)

## Testing

### Automated Smoke Test
```bash
npm test
```

This verifies core project wiring (API route mounting, session store configuration, winner job initialization, and schema presence) without requiring a running database.

### Manual Testing with Swagger
1. Start the server
2. Navigate to `http://localhost:3000/api-docs`
3. Test endpoints directly from the Swagger UI

### Example API Calls

**Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@university.edu",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@university.edu",
    "password": "SecurePass123!"
  }'
```

**Place a bid (with token):**
```bash
curl -X POST http://localhost:3000/api/bidding/place \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 100,
    "targetDate": "2026-02-20"
  }'
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Email Verification
- Tokens expire after 24 hours
- Secure random token generation
- One-time use tokens

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes

### Headers (Helmet.js)
- Content Security Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security

## Project Structure

```
CW_Express/
├── config/
│   ├── config.js          # Configuration loader
│   └── dbConfig.js        # Database connection pool
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── profileController.js # Profile management
│   └── biddingController.js # Bidding logic
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── security.js        # Helmet, CORS, rate limiting
│   ├── validator.js       # Input validation
│   └── upload.js          # File upload handling
├── services/
│   ├── emailService.js    # Email sending
│   └── biddingService.js  # Bidding business logic
├── routes/
│   ├── auth.js            # Auth routes
│   ├── profile.js         # Profile routes
│   └── bidding.js         # Bidding routes
├── jobs/
│   └── winnerSelection.js # Daily winner selection cron
├── swagger/
│   └── swagger.js         # API documentation config
├── database/
│   └── schema.sql         # Database schema
├── uploads/
│   └── profiles/          # Profile images
├── .env                   # Environment variables
├── index.js               # Main server file
└── package.json           # Dependencies

```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists: `CREATE DATABASE alumni_platform;`

### Email Verification Not Working
- Configure Gmail app password (not regular password)
- Enable "Less secure app access" or use App Passwords
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`

### CORS Errors
- Add your frontend URL to CORS_ORIGIN in `.env`
- Example: `CORS_ORIGIN=http://localhost:3000,http://localhost:5173`

## License

This project is for educational purposes.

## Support

For issues or questions, contact: support@university.edu
