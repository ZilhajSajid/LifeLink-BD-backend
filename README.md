# 🩸 LifeLink BD — Blood Donation & Emergency Platform

LifeLink BD is a backend API for a blood donation and emergency blood request platform. It connects blood donors with people or organizations who need blood and provides authentication, donor management, blood request management, payment processing, donation tracking, and analytics.

The project is built with **Node.js, Express.js, TypeScript, PostgreSQL, and Prisma ORM** and is deployed on **Vercel**.

---

## 🚀 Live API

**Production API:**
https://life-link-bd-backend.vercel.app


---

## 📚 API Documentation

**Postman Collection:**
https://www.postman.com/zilhajsajid-146869/workspace/my-project/collection/49966122-5a543fd9-0954-403b-92a0-fb8ee73d4e84?action=share&creator=49966122

The Postman collection contains the available API endpoints, request examples, authentication requirements, and response examples.

---

## 🛠️ Technology Stack

### Backend

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Prisma ORM

### Authentication & Security

* JWT Authentication
* Google OAuth
* bcrypt
* Role-Based Access Control (RBAC)
* HTTP-only Cookies
* OTP-based email verification
* Password reset with OTP

### Validation & Data Handling

* Zod
* Prisma
* Custom error handling
* Centralized request validation

### External Services

* Redis — OTP and caching
* Nodemailer — Email delivery
* EJS — Email templates
* Cloudinary — Image/file storage
* Multer — File upload
* bKash — Payment gateway

### Development & Deployment

* Bun
* Git & GitHub
* Vercel
* Postman / Thunder Client

---

# 👥 User Roles

LifeLink BD has three main roles:

| Role          | Description                                                                                |
| ------------- | ------------------------------------------------------------------------------------------ |
| `DONOR`       | Can apply as a donor, manage availability, accept donation requests and complete donations |
| `REQUESTER`   | Can create blood requests, make payments and manage their blood requests                   |
| `ADMIN`       | Can manage donors, monitor requests, payments and system analytics                         |
| `SUPER_ADMIN` | Has administrative access similar to Admin with higher-level system privileges             |

---

# ✨ Features

## 🔐 Authentication

* User registration
* Email verification with OTP
* Login
* Refresh token
* Logout/authenticated session handling
* Google authentication
* Get current user
* Forgot password
* Reset password using OTP
* Password hashing with bcrypt
* Role-based authorization
* Account status management

---

## 🩸 Donor Management

Donors can:

* Apply to become a donor
* Submit donor information
* Upload certificates and additional documents
* Verify donor email
* Check donor status
* Manage availability
* View donor information
* Participate in blood donation requests

Admins can:

* View donor applications
* Approve donors
* Reject donors
* Search donors
* Filter donors
* Sort donors
* Paginate donor results

Unverified donor applications are also cleaned up automatically using scheduled jobs.

---

## 🏥 Blood Request Management

Requesters can:

* Create blood requests
* Specify required blood group
* Specify required blood units
* Set urgency
* Provide hospital information
* Specify required date
* Provide reason for the request
* View their own blood requests
* Cancel eligible requests

Blood requests support different statuses:

```text
PENDING
VERIFIED
MATCHING
PARTIALLY_FULFILLED
FULFILLED
CANCELLED
EXPIRED
REJECTED
```

---

## 💳 Payment System

LifeLink BD integrates the **bKash payment gateway**.

Payment functionality includes:

* Create payment
* bKash payment processing
* Payment callback
* Payment verification
* Payment status tracking
* Pay existing failed/unpaid requests
* Cancel eligible requests
* View requester payment history
* Admin payment management
* View individual payment details

Payment statuses include:

```text
UNPAID
PAID
FAILED
```

---

## 🩸 Donation Management

The donation system connects donors with blood requests through donation assignments.

Donation flow:

```text
Blood Request
      ↓
Donor
      ↓
Donation Assignment
      ↓
Donation
      ↓
Completed Donation
```

Donors can:

* Accept blood donation requests
* Create donation records
* Schedule donations
* View their donations
* Complete donations
* Cancel donations

Donation assignment statuses:

```text
PENDING
ACCEPTED
REJECTED
CANCELLED
COMPLETED
```

Donation statuses:

```text
SCHEDULED
COMPLETED
CANCELLED
```

When a donation is completed, the system updates:

* Donor's last donation date
* Donor's total donations
* Donor availability
* Blood request fulfilled units
* Blood request status

---

# 📊 Analytics

LifeLink BD provides role-based analytics APIs.

## Admin Analytics

```http
GET /analytics/admin-analytics
```

Accessible by:

```text
ADMIN
SUPER_ADMIN
```

Provides:

* Total donors
* Pending donors
* Approved donors
* Rejected donors
* Available donors
* Total requesters
* Total blood requests
* Blood request status statistics
* Total donations
* Donation statistics
* Total payments
* Paid/unpaid/failed payment statistics
* Total revenue

---

## Donor Analytics

```http
GET /analytics/donor-analytics
```

Accessible by:

```text
DONOR
```

Provides:

* Total donation assignments
* Pending assignments
* Accepted assignments
* Completed assignments
* Cancelled assignments
* Total donations
* Scheduled donations
* Completed donations
* Cancelled donations
* Total donated blood units
* Total lifetime donations
* Last donation date
* Current availability

---

## Requester Analytics

```http
GET /analytics/requester-analytics
```

Accessible by:

```text
REQUESTER
```

Provides:

* Total blood requests
* Pending requests
* Verified requests
* Matching requests
* Partially fulfilled requests
* Fulfilled requests
* Cancelled requests
* Rejected requests
* Expired r
