const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

/*
========================================================
GOOGLE CLIENT
========================================================
*/

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

/*
========================================================
CREATE RIDEBACK JWT
========================================================
*/

const createRideBackToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            email: user.email,
        },
        process.env.JWT_SECRET || "rideback_secret",
        {
            expiresIn: "7d",
        }
    );
};

/*
========================================================
REGISTER
========================================================
*/

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            role,
        } = req.body;

        /*
        Validate input
        */

        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        /*
        Normalize values
        */

        const normalizedEmail =
            String(email).trim().toLowerCase();

        const normalizedRole =
            String(role).trim().toLowerCase();

        const normalizedPhone =
            String(phone).trim();

        const normalizedName =
            String(name).trim();

        /*
        Validate role
        */

        if (
            normalizedRole !== "passenger" &&
            normalizedRole !== "rider"
        ) {
            return res.status(400).json({
                message: "Invalid role selected",
            });
        }

        /*
        Check existing email
        */

        const result = await db.query(
            `
            SELECT id
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        const existingUsers = result.rows;

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email already registered",
            });
        }

        /*
        Check existing phone
        */

        const phoneResult = await db.query(
            `
            SELECT id
            FROM users
            WHERE phone = $1
            LIMIT 1
            `,
            [normalizedPhone]
        );

        const existingPhoneUsers =
            phoneResult.rows;

        if (existingPhoneUsers.length > 0) {
            return res.status(409).json({
                message: "Phone number already registered",
            });
        }

        /*
        Hash password
        */

        const hashedPassword =
            await bcrypt.hash(password, 10);

        /*
        Insert user
        */

        const insertResult = await db.query(
            `
            INSERT INTO users
            (
                name,
                email,
                phone,
                password,
                role,
                availability
            )
            VALUES
            ($1, $2, $3, $4, $5, 'available')
            RETURNING
                id,
                name,
                email,
                phone,
                role,
                availability,
                current_location
            `,
            [
                normalizedName,
                normalizedEmail,
                normalizedPhone,
                hashedPassword,
                normalizedRole,
            ]
        );

        const newUser = insertResult.rows[0];

        /*
        Success
        */

        return res.status(201).json({
            message: "Registration successful",

            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                availability:
                    newUser.availability,
                current_location:
                    newUser.current_location,
            },
        });

    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        /*
        PostgreSQL unique violation
        */

        if (error.code === "23505") {

            if (
                error.constraint ===
                "users_email_key"
            ) {
                return res.status(409).json({
                    message:
                        "Email already registered",
                });
            }

            if (
                error.constraint ===
                "users_phone_key"
            ) {
                return res.status(409).json({
                    message:
                        "Phone number already registered",
                });
            }

            if (
                error.constraint ===
                "users_google_id_key"
            ) {
                return res.status(409).json({
                    message:
                        "Google account already connected",
                });
            }

            return res.status(409).json({
                message:
                    "User information already exists",
            });
        }

        return res.status(500).json({
            message: "Registration failed",
            error: error.message,
        });
    }
};

/*
========================================================
NORMAL LOGIN
========================================================
*/

const login = async (req, res) => {

    try {

        console.log("================================");
        console.log("LOGIN REQUEST RECEIVED");
        console.log("BODY:", req.body);
        console.log("================================");

        const {
            email,
            password,
            role,
        } = req.body;

        /*
        Validate input
        */

        if (
            !email ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                message:
                    "Email, password and role are required",
            });
        }

        /*
        Normalize
        */

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const normalizedRole =
            String(role)
                .trim()
                .toLowerCase();

        /*
        Validate role
        */

        if (
            normalizedRole !== "passenger" &&
            normalizedRole !== "rider"
        ) {
            return res.status(400).json({
                message:
                    "Invalid role selected",
            });
        }

        /*
        Find user
        */

        const result = await db.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                password,
                role,
                current_location,
                availability,
                google_id
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        /*
        IMPORTANT:
        PostgreSQL returns rows
        */

        const users = result.rows;

        /*
        User not found
        */

        if (users.length === 0) {

            console.log(
                "LOGIN FAILED: USER NOT FOUND"
            );

            return res.status(401).json({
                message:
                    "Invalid email or password",
            });
        }

        const user = users[0];

        console.log(
            "USER FOUND:",
            {
                id: user.id,
                email: user.email,
                role: user.role,
            }
        );

        /*
        Check role
        */

        if (
            String(user.role)
                .toLowerCase() !==
            normalizedRole
        ) {

            console.log(
                "LOGIN FAILED: ROLE MISMATCH"
            );

            return res.status(401).json({
                message:
                    `This account is registered as ${user.role}. Please select ${user.role}.`,
            });
        }

        /*
        Google-only account
        */

        if (!user.password) {

            return res.status(401).json({
                message:
                    "This account uses Google Sign-In. Please continue with Google.",
            });
        }

        /*
        Check password
        */

        const passwordMatches =
            await bcrypt.compare(
                String(password),
                user.password
            );

        if (!passwordMatches) {

            console.log(
                "LOGIN FAILED: WRONG PASSWORD"
            );

            return res.status(401).json({
                message:
                    "Invalid email or password",
            });
        }

        /*
        Create JWT
        */

        const token =
            createRideBackToken(user);

        console.log(
            "LOGIN SUCCESS:",
            user.email
        );

        /*
        Return user
        */

        return res.status(200).json({

            message:
                "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                current_location:
                    user.current_location,
                availability:
                    user.availability,
            },
        });

    } catch (error) {

        console.error(
            "LOGIN SERVER ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Server error during login",
            error: error.message,
        });
    }
};

/*
========================================================
GOOGLE LOGIN
========================================================
*/

const googleLogin = async (req, res) => {

    try {

        const {
            credential,
            role,
        } = req.body;

        /*
        Validate credential
        */

        if (!credential) {

            return res.status(400).json({
                message:
                    "Google credential is required",
            });
        }

        /*
        Validate role
        */

        const normalizedRole =
            role
                ? String(role)
                    .trim()
                    .toLowerCase()
                : "";

        if (
            normalizedRole !== "passenger" &&
            normalizedRole !== "rider"
        ) {

            return res.status(400).json({
                message:
                    "Please select Passenger or Rider before signing in with Google.",
            });
        }

        /*
        Check Google Client ID
        */

        if (!process.env.GOOGLE_CLIENT_ID) {

            console.error(
                "GOOGLE_CLIENT_ID is missing from server/.env"
            );

            return res.status(500).json({
                message:
                    "Google authentication is not configured on the server.",
            });
        }

        /*
        Verify Google token
        */

        const ticket =
            await googleClient.verifyIdToken({
                idToken: credential,
                audience:
                    process.env.GOOGLE_CLIENT_ID,
            });

        const payload =
            ticket.getPayload();

        if (!payload) {

            return res.status(401).json({
                message:
                    "Invalid Google authentication response.",
            });
        }

        /*
        Google information
        */

        const googleId =
            payload.sub;

        const googleEmail =
            payload.email
                ? String(payload.email)
                    .trim()
                    .toLowerCase()
                : "";

        const googleName =
            payload.name ||
            googleEmail.split("@")[0] ||
            "RideBack User";

        /*
        Verify email
        */

        if (
            !googleEmail ||
            payload.email_verified !== true
        ) {

            return res.status(401).json({
                message:
                    "Google email verification could not be confirmed.",
            });
        }

        if (!googleId) {

            return res.status(401).json({
                message:
                    "Google account ID is missing.",
            });
        }

        console.log(
            "GOOGLE USER VERIFIED:",
            {
                email: googleEmail,
                googleId: googleId,
                name: googleName,
            }
        );

        /*
        ====================================================
        FIND USER BY GOOGLE ID
        ====================================================
        */

        const googleResult =
            await db.query(
                `
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    password,
                    role,
                    current_location,
                    availability,
                    google_id
                FROM users
                WHERE google_id = $1
                LIMIT 1
                `,
                [googleId]
            );

        const googleUsers =
            googleResult.rows;

        /*
        ====================================================
        EXISTING GOOGLE USER
        ====================================================
        */

        if (googleUsers.length > 0) {

            const user =
                googleUsers[0];

            /*
            Existing Google account already
            belongs to its stored role.
            */

            if (
                String(user.role)
                    .toLowerCase() !==
                normalizedRole
            ) {

                return res.status(401).json({
                    message:
                        `This Google account is registered as ${user.role}. Please select ${user.role}.`,
                });
            }

            const token =
                createRideBackToken(user);

            console.log(
                "GOOGLE LOGIN SUCCESS:",
                user.email
            );

            return res.status(200).json({

                message:
                    "Google Sign-In successful",

                token,

                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    current_location:
                        user.current_location,
                    availability:
                        user.availability,
                },
            });
        }

        /*
        ====================================================
        FIND EXISTING RIDEBACK ACCOUNT BY EMAIL
        ====================================================
        */

        const emailResult =
            await db.query(
                `
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    password,
                    role,
                    current_location,
                    availability,
                    google_id
                FROM users
                WHERE email = $1
                LIMIT 1
                `,
                [googleEmail]
            );

        const emailUsers =
            emailResult.rows;

        /*
        ====================================================
        EXISTING EMAIL ACCOUNT
        ====================================================
        */

        if (emailUsers.length > 0) {

            const user =
                emailUsers[0];

            /*
            Role must match
            */

            if (
                String(user.role)
                    .toLowerCase() !==
                normalizedRole
            ) {

                return res.status(401).json({
                    message:
                        `This account is registered as ${user.role}. Please select ${user.role}.`,
                });
            }

            /*
            Link Google ID
            */

            const updateResult =
                await db.query(
                    `
                    UPDATE users
                    SET google_id = $1
                    WHERE id = $2
                    RETURNING
                        id,
                        name,
                        email,
                        phone,
                        password,
                        role,
                        current_location,
                        availability,
                        google_id
                    `,
                    [
                        googleId,
                        user.id,
                    ]
                );

            const updatedUser =
                updateResult.rows[0];

            const token =
                createRideBackToken(
                    updatedUser
                );

            console.log(
                "GOOGLE ACCOUNT LINKED:",
                updatedUser.email
            );

            return res.status(200).json({

                message:
                    "Google account linked successfully",

                token,

                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    role: updatedUser.role,
                    current_location:
                        updatedUser.current_location,
                    availability:
                        updatedUser.availability,
                },
            });
        }

        /*
        ====================================================
        CREATE NEW GOOGLE USER
        ====================================================
        */

        const insertResult =
            await db.query(
                `
                INSERT INTO users
                (
                    name,
                    email,
                    phone,
                    password,
                    role,
                    availability,
                    google_id
                )
                VALUES
                (
                    $1,
                    $2,
                    NULL,
                    NULL,
                    $3,
                    'available',
                    $4
                )
                RETURNING
                    id,
                    name,
                    email,
                    phone,
                    password,
                    role,
                    current_location,
                    availability,
                    google_id
                `,
                [
                    String(googleName).trim(),
                    googleEmail,
                    normalizedRole,
                    googleId,
                ]
            );

        const newUser =
            insertResult.rows[0];

        /*
        Create JWT
        */

        const token =
            createRideBackToken(
                newUser
            );

        console.log(
            "NEW GOOGLE USER CREATED:",
            newUser.email
        );

        return res.status(201).json({

            message:
                "Google account created successfully",

            token,

            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                current_location:
                    newUser.current_location,
                availability:
                    newUser.availability,
            },
        });

    } catch (error) {

        console.error(
            "GOOGLE LOGIN ERROR:",
            error
        );

        /*
        PostgreSQL duplicate key
        */

        if (error.code === "23505") {

            if (
                error.constraint ===
                "users_google_id_key"
            ) {

                return res.status(409).json({
                    message:
                        "This Google account is already connected to another RideBack account.",
                });
            }

            return res.status(409).json({
                message:
                    "This account already exists.",
            });
        }

        /*
        Invalid Google token
        */

        const errorMessage =
            String(error.message || "")
                .toLowerCase();

        if (
            errorMessage.includes(
                "wrong number of segments"
            ) ||
            errorMessage.includes(
                "invalid token"
            ) ||
            errorMessage.includes(
                "jwt"
            ) ||
            errorMessage.includes(
                "unable to verify"
            )
        ) {

            return res.status(401).json({
                message:
                    "Google authentication token is invalid or expired.",
            });
        }

        return res.status(500).json({
            message:
                "Unable to complete Google Sign-In.",
            error: error.message,
        });
    }
};

/*
========================================================
EMAIL TRANSPORTER
========================================================
*/

const transporter =
    nodemailer.createTransport({
        service: "gmail",

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

/*
========================================================
FORGOT PASSWORD
========================================================
*/

const forgotPassword = async (req, res) => {

    try {

        const {
            email,
        } = req.body;

        if (!email) {

            return res.status(400).json({
                message:
                    "Email is required",
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        /*
        Find user
        */

        const result =
            await db.query(
                `
                SELECT
                    id,
                    name,
                    email
                FROM users
                WHERE email = $1
                LIMIT 1
                `,
                [normalizedEmail]
            );

        const users =
            result.rows;

        /*
        Always same response
        */

        if (users.length === 0) {

            return res.status(200).json({
                message:
                    "If an account exists with this email, a password reset link has been sent.",
            });
        }

        const user =
            users[0];

        /*
        Invalidate old tokens
        */

        await db.query(
            `
            UPDATE password_reset_tokens
            SET used = TRUE
            WHERE user_id = $1
            AND used = FALSE
            `,
            [user.id]
        );

        /*
        Generate token
        */

        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        /*
        Hash token
        */

        const tokenHash =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        /*
        Expiry = 15 minutes
        */

        const expiresAt =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );

        /*
        Store token
        */

        await db.query(
            `
            INSERT INTO password_reset_tokens
            (
                user_id,
                token_hash,
                expires_at,
                used
            )
            VALUES
            (
                $1,
                $2,
                $3,
                FALSE
            )
            `,
            [
                user.id,
                tokenHash,
                expiresAt,
            ]
        );

        /*
        Frontend URL
        */

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:3000";

        const resetUrl =
            `${frontendUrl}/reset-password?token=${resetToken}`;

        /*
        Send email
        */

        await transporter.sendMail({

            from:
                `"RideBack" <${process.env.EMAIL_USER}>`,

            to:
                user.email,

            subject:
                "RideBack - Reset Your Password",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                    background: #f5f7fb;
                ">

                    <div style="
                        background: white;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow:
                            0 5px 20px
                            rgba(0,0,0,0.08);
                    ">

                        <h1 style="
                            color: #2563eb;
                            margin-bottom: 10px;
                        ">
                            RideBack
                        </h1>

                        <h2>
                            Password Reset Request
                        </h2>

                        <p>
                            Hello ${user.name},
                        </p>

                        <p>
                            We received a request to reset
                            your RideBack account password.
                        </p>

                        <p>
                            Click the button below to
                            create a new password.
                        </p>

                        <div style="
                            text-align: center;
                            margin: 30px 0;
                        ">

                            <a
                                href="${resetUrl}"
                                style="
                                    display: inline-block;
                                    padding: 14px 25px;
                                    background: #2563eb;
                                    color: white;
                                    text-decoration: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                "
                            >
                                Reset Password
                            </a>

                        </div>

                        <p>
                            This link will expire in
                            <strong>15 minutes</strong>.
                        </p>

                        <p>
                            If you did not request a
                            password reset, you can safely
                            ignore this email.
                        </p>

                        <hr />

                        <p style="
                            color: #777;
                            font-size: 13px;
                        ">
                            RideBack Security Team
                        </p>

                    </div>

                </div>
            `,
        });

        console.log(
            "PASSWORD RESET EMAIL SENT:",
            user.email
        );

        return res.status(200).json({
            message:
                "If an account exists with this email, a password reset link has been sent.",
        });

    } catch (error) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to process password reset request",
            error: error.message,
        });
    }
};

/*
========================================================
RESET PASSWORD
========================================================
*/

const resetPassword = async (req, res) => {

    try {

        const {
            token,
            password,
        } = req.body;

        /*
        Validate input
        */

        if (!token || !password) {

            return res.status(400).json({
                message:
                    "Reset token and new password are required",
            });
        }

        /*
        Password validation
        */

        if (
            String(password).length < 6
        ) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters long",
            });
        }

        /*
        Hash reset token
        */

        const tokenHash =
            crypto
                .createHash("sha256")
                .update(String(token))
                .digest("hex");

        /*
        Find token
        */

        const result =
            await db.query(
                `
                SELECT
                    id,
                    user_id,
                    expires_at,
                    used
                FROM password_reset_tokens
                WHERE token_hash = $1
                LIMIT 1
                `,
                [tokenHash]
            );

        const tokens =
            result.rows;

        /*
        Token not found
        */

        if (tokens.length === 0) {

            return res.status(400).json({
                message:
                    "Invalid or expired reset link",
            });
        }

        const resetRecord =
            tokens[0];

        /*
        Already used
        */

        if (resetRecord.used) {

            return res.status(400).json({
                message:
                    "This reset link has already been used",
            });
        }

        /*
        Check expiry
        */

        if (
            new Date(
                resetRecord.expires_at
            ).getTime() < Date.now()
        ) {

            return res.status(400).json({
                message:
                    "This reset link has expired",
            });
        }

        /*
        Hash new password
        */

        const hashedPassword =
            await bcrypt.hash(
                String(password),
                10
            );

        /*
        Update password
        */

        await db.query(
            `
            UPDATE users
            SET password = $1
            WHERE id = $2
            `,
            [
                hashedPassword,
                resetRecord.user_id,
            ]
        );

        /*
        Mark token used
        */

        await db.query(
            `
            UPDATE password_reset_tokens
            SET used = TRUE
            WHERE id = $1
            `,
            [resetRecord.id]
        );

        console.log(
            "PASSWORD RESET SUCCESS:",
            resetRecord.user_id
        );

        return res.status(200).json({
            message:
                "Password reset successful. You can now login with your new password.",
        });

    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to reset password",
            error: error.message,
        });
    }
};

/*
========================================================
EXPORTS
========================================================
*/

module.exports = {
    register,
    login,
    googleLogin,
    forgotPassword,
    resetPassword,
};