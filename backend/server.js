// ==============================================
// LANVAI SERVER - FULL DATABASE INTEGRATION
// ==============================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// ==============================================
// EMAIL CONFIGURATION - NODEMAILER & DOTENV
// ==============================================

// Load environment variables from .env file
try {
    require('dotenv').config();
    console.log('✅ Dotenv loaded successfully');
} catch (err) {
    console.log('⚠️ Dotenv not found, using default environment variables');
}

// Import nodemailer for email functionality
let nodemailer;
try {
    nodemailer = require('nodemailer');
    console.log('✅ Nodemailer loaded successfully');
} catch (err) {
    console.log('⚠️ Nodemailer not found. Email functionality will be disabled.');
    console.log('   Please run: npm install nodemailer dotenv');
}

// Import axios for IntaSend API calls
let axios;
try {
    axios = require('axios');
    console.log('✅ Axios loaded successfully');
} catch (err) {
    console.log('⚠️ Axios not found. IntaSend functionality will be disabled.');
    console.log('   Please run: npm install axios');
}

const PORT = 5000;
const PUBLIC_DIR = path.join(__dirname, '..');

// ========== EMAIL TRANSPORTER ==========
let emailTransporter = null;
let emailEnabled = false;

function setupEmailTransporter() {
    if (!nodemailer) {
        console.log('⚠️ Email disabled: Nodemailer not available');
        return false;
    }

    try {
        const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com';
        const emailPass = process.env.EMAIL_PASS || 'your-app-password';

        if (emailUser === 'your-email@gmail.com' || emailPass === 'your-app-password') {
            console.log('⚠️ Email disabled: Please configure EMAIL_USER and EMAIL_PASS in .env file');
            console.log('   Create .env file with:');
            console.log('   EMAIL_USER=your-email@gmail.com');
            console.log('   EMAIL_PASS=your-app-password');
            return false;
        }

        emailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        // Verify connection
        emailTransporter.verify(function(error, success) {
            if (error) {
                console.log('❌ Email transporter error:', error.message);
                emailEnabled = false;
            } else {
                console.log('✅ Email transporter ready!');
                emailEnabled = true;
            }
        });

        return true;
    } catch (error) {
        console.log('❌ Failed to setup email transporter:', error.message);
        return false;
    }
}

// ===== SEND EMAIL FUNCTION =====
async function sendEmailReply(to, subject, htmlContent, textContent) {
    if (!emailEnabled || !emailTransporter) {
        console.log('⚠️ Email not sent: Email is disabled');
        return { success: false, error: 'Email service is disabled' };
    }

    try {
        const mailOptions = {
            from: `"Lanvai Support" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
            to: to,
            subject: subject,
            text: textContent || '',
            html: htmlContent || textContent || ''
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('[Email] ✅ Email sent to:', to, 'Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email] ❌ Failed to send email:', error.message);
        return { success: false, error: error.message };
    }
}

// ==============================================
// INTASEND CONFIGURATION
// ==============================================

const INTASEND_CONFIG = {
    publishableKey: process.env.INTASEND_PUBLISHABLE_KEY || '',
    secretKey: process.env.INTASEND_SECRET_KEY || '',
    walletId: process.env.INTASEND_WALLET_ID || '',
    environment: process.env.INTASEND_ENVIRONMENT || 'live',
    apiUrl: process.env.INTASEND_ENVIRONMENT === 'live' 
        ? 'https://api.intasend.com' 
        : 'https://sandbox.intasend.com'
};

console.log('[IntaSend] Configuration:');
console.log('  Environment:', INTASEND_CONFIG.environment);
console.log('  Wallet ID:', INTASEND_CONFIG.walletId);
console.log('  API URL:', INTASEND_CONFIG.apiUrl);
console.log('  Publishable Key:', INTASEND_CONFIG.publishableKey ? '✅ Set' : '❌ Not set');
console.log('  Secret Key:', INTASEND_CONFIG.secretKey ? '✅ Set' : '❌ Not set');

// ===== INTASEND API HELPER =====
async function intasendRequest(endpoint, method = 'POST', data = {}) {
    if (!INTASEND_CONFIG.secretKey) {
        console.warn('[IntaSend] Secret key not configured. Using simulation mode.');
        return {
            status: 'success',
            id: 'sim_' + Date.now(),
            invoice_id: 'inv_sim_' + Date.now(),
            message: 'Simulation mode - payment processed',
            simulation: true
        };
    }

    try {
        const url = `${INTASEND_CONFIG.apiUrl}/api/v1${endpoint}`;
        console.log('[IntaSend] Request:', method, url);
        console.log('[IntaSend] Data:', JSON.stringify(data, null, 2));
        
        const response = await axios({
            method: method,
            url: url,
            headers: {
                'Authorization': `Bearer ${INTASEND_CONFIG.secretKey}`,
                'Content-Type': 'application/json'
            },
            data: data
        });
        
        console.log('[IntaSend] Response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('[IntaSend Error]', error.response?.data || error.message);
        if (error.response?.data) {
            throw new Error(error.response.data.message || error.response.data.error || 'IntaSend API error');
        }
        throw error;
    }
}



// ==============================================
// AUTH HANDLERS
// ==============================================

// ==============================================
// VERIFICATION CODE FUNCTIONS
// ==============================================

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== SEND VERIFICATION EMAIL (with fallback) =====
async function sendVerificationEmail(email, code) {
    const subject = 'Verify Your Lanvai Account';
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Account</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #7c3aed; }
                .header h1 { color: #1e3a5f; }
                .content { padding: 20px 0; color: #333; line-height: 1.6; }
                .code-box { background: #f5f3ff; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; color: #7c3aed; letter-spacing: 5px; margin: 15px 0; }
                .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Verify Your Account</h1>
                </div>
                <div class="content">
                    <p>Hi there!</p>
                    <p>Thank you for signing up for Lanvai. Please use the verification code below to complete your registration:</p>
                    <div class="code-box">${code}</div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Lanvai | Smart Solutions for Smart Businesses</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const textContent = `Verify Your Lanvai Account\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
    
    return await sendEmailReply(email, subject, htmlContent, textContent);
}

// ==============================================
// AUTH HANDLERS
// ==============================================
// ==============================================
// AD EXCHANGE HANDLERS - ADD TO SERVER.JS
// ==============================================

// ===== SUBMIT AD EXCHANGE INQUIRY (Ad Owner & Advertiser) =====
// ==============================================
// AD EXCHANGE HANDLERS - ADD TO SERVER.JS
// ==============================================

// ===== SUBMIT AD EXCHANGE INQUIRY =====
function handleAdExchangeSubmit(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[AdExchange Submit] Received:', data);
            
            if (!data.full_name || !data.email || !data.course) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Full name, email, and course are required' 
                });
                return;
            }
            
            const visitorId = getVisitorId(req, res);

            if (dbConnected && pool) {
                try {
                    // Create table if it doesn't exist
                    await pool.query(`
                        CREATE TABLE IF NOT EXISTS ad_exchange_inquiries (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            full_name VARCHAR(255) NOT NULL,
                            email VARCHAR(255) NOT NULL,
                            phone VARCHAR(50),
                            inquiry_type VARCHAR(50) NOT NULL,
                            course VARCHAR(255) NOT NULL,
                            message TEXT,
                            status VARCHAR(50) DEFAULT 'pending',
                            response TEXT,
                            responded_at TIMESTAMP NULL,
                            admin_name VARCHAR(100),
                            email_sent BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            INDEX idx_email (email),
                            INDEX idx_status (status),
                            INDEX idx_type (inquiry_type),
                            INDEX idx_created_at (created_at)
                        )
                    `);
                    
                    const [result] = await pool.query(
                        `INSERT INTO ad_exchange_inquiries 
                         (full_name, email, phone, inquiry_type, course, message, status, created_at) 
                         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
                        [
                            data.full_name.trim(),
                            data.email.trim(),
                            data.phone || '',
                            data.type || 'adowner',
                            data.course,
                            data.message || ''
                        ]
                    );
                    
                    console.log('[AdExchange Submit] ✅ Saved! ID:', result.insertId);
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Request sent successfully!',
                        inquiry_id: result.insertId
                    });
                } catch (err) {
                    console.error('[AdExchange Submit DB Error]', err);
                    sendJSON(res, 500, { 
                        success: false, 
                        error: 'Database error: ' + err.message 
                    });
                }
            } else {
                storage.adExchangeInquiries = storage.adExchangeInquiries || [];
                storage.adExchangeInquiries.push({
                    ...data,
                    visitorId,
                    timestamp: new Date().toISOString()
                });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Request sent (fallback)',
                    inquiry_id: storage.adExchangeInquiries.length
                });
            }
        } catch (e) {
            console.error('[AdExchange Submit Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid request: ' + e.message });
        }
    });
}






// ===== UPDATE AD EXCHANGE INQUIRY - FIXED =====
function handleUpdateAdExchangeInquiry(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Update AdExchange Inquiry] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'Inquiry ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                // Check if this is a campaign (advertiser) or regular inquiry
                const isCampaign = data.id.toString().startsWith('camp_');
                
                if (isCampaign) {
                    // Handle campaign update
                    const campaignId = data.id.replace('camp_', '');
                    const [campaignRows] = await pool.query(
                        'SELECT * FROM advertiser_campaigns WHERE id = ?',
                        [campaignId]
                    );
                    
                    if (!campaignRows || campaignRows.length === 0) {
                        sendJSON(res, 404, { success: false, error: 'Campaign not found' });
                        return;
                    }
                    
                    const campaign = campaignRows[0];
                    
                    let updates = [];
                    let params = [];
                    
                    if (data.status) {
                        updates.push('status = ?');
                        params.push(data.status);
                    }
                    
                    if (updates.length === 0) {
                        sendJSON(res, 400, { success: false, error: 'No fields to update' });
                        return;
                    }
                    
                    params.push(campaignId);
                    const [result] = await pool.query(
                        `UPDATE advertiser_campaigns SET ${updates.join(', ')} WHERE id = ?`,
                        params
                    );
                    
                    console.log('[Update AdExchange Campaign] ✅ Updated campaign ID:', campaignId);
                    
                    // Send email if response provided
                    let emailResult = { success: false, error: 'No email sent' };
                    if (data.response) {
                        const emailSubject = `Response to your Campaign Request - ${campaign.ad_format}`;
                        const adminName = data.adminName || 'Lanvai AdExchange Team';
                        const emailHtml = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <title>Response from Lanvai AdExchange</title>
                                <style>
                                    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                                    .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #fbbf24; }
                                    .header h1 { color: #1e3a5f; font-size: 24px; }
                                    .content { padding: 20px 0; color: #333; line-height: 1.6; }
                                    .message-box { background: #fef3c7; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #fbbf24; margin: 15px 0; }
                                    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>📢 Lanvai ADExchange</h1>
                                        <p style="color: #64748b;">Response to Your Campaign Inquiry</p>
                                    </div>
                                    <div class="content">
                                        <p>Dear <strong>${campaign.advertiser_name}</strong>,</p>
                                        <p>Thank you for your interest in Lanvai ADExchange. We have reviewed your campaign request.</p>
                                        <div class="message-box">
                                            <p>${data.response}</p>
                                        </div>
                                        <p>If you have any further questions, feel free to reply to this email or contact us at support@lanvai.com.</p>
                                        <p style="margin-top: 20px;">
                                            Best regards,<br>
                                            <strong>${adminName}</strong><br>
                                            Lanvai AdExchange
                                        </p>
                                    </div>
                                    <div class="footer">
                                        <p>&copy; 2025 Lanvai | Smart Advertising Solutions</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `;
                        const emailText = `Dear ${campaign.advertiser_name},\n\nThank you for your interest in Lanvai ADExchange. We have reviewed your campaign request.\n\n${data.response}\n\nIf you have any further questions, feel free to reply to this email or contact us at support@lanvai.com.\n\nBest regards,\n${adminName}\nLanvai AdExchange`;
                        emailResult = await sendEmailReply(campaign.advertiser_email, emailSubject, emailHtml, emailText);
                    }
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Campaign updated successfully!',
                        affected_rows: result.affectedRows,
                        email_sent: emailResult.success,
                        email_error: emailResult.error
                    });
                    return;
                }
                
                // Handle regular AdExchange inquiry (AdOwner)
                const [inquiryRows] = await pool.query('SELECT * FROM ad_exchange_inquiries WHERE id = ?', [data.id]);
                
                if (!inquiryRows || inquiryRows.length === 0) {
                    sendJSON(res, 404, { success: false, error: 'Inquiry not found' });
                    return;
                }
                
                const inquiry = inquiryRows[0];
                
                let updates = [];
                let params = [];
                
                if (data.status) {
                    updates.push('status = ?');
                    params.push(data.status);
                }
                if (data.response !== undefined) {
                    updates.push('response = ?');
                    params.push(data.response);
                    updates.push('responded_at = NOW()');
                }
                if (data.adminName) {
                    updates.push('admin_name = ?');
                    params.push(data.adminName);
                }
                
                if (updates.length === 0) {
                    sendJSON(res, 400, { success: false, error: 'No fields to update' });
                    return;
                }
                
                params.push(data.id);
                const [result] = await pool.query(
                    `UPDATE ad_exchange_inquiries SET ${updates.join(', ')} WHERE id = ?`,
                    params
                );
                
                console.log('[Update AdExchange Inquiry] ✅ Updated inquiry ID:', data.id);
                
                // Send email if response provided
                let emailResult = { success: false, error: 'No email sent' };
                if (data.response) {
                    const emailSubject = `Response to your Ad Exchange Inquiry - ${inquiry.course}`;
                    const adminName = data.adminName || 'Lanvai AdExchange Team';
                    const emailHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>Response from Lanvai AdExchange</title>
                            <style>
                                body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #fbbf24; }
                                .header h1 { color: #1e3a5f; font-size: 24px; }
                                .content { padding: 20px 0; color: #333; line-height: 1.6; }
                                .message-box { background: #fef3c7; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #fbbf24; margin: 15px 0; }
                                .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>📢 Lanvai ADExchange</h1>
                                    <p style="color: #64748b;">Response to Your Inquiry</p>
                                </div>
                                <div class="content">
                                    <p>Dear <strong>${inquiry.full_name}</strong>,</p>
                                    <p>Thank you for your interest in Lanvai ADExchange. We have reviewed your inquiry regarding <strong>${inquiry.course}</strong>.</p>
                                    <div class="message-box">
                                        <p>${data.response}</p>
                                    </div>
                                    <p>If you have any further questions, feel free to reply to this email or contact us at support@lanvai.com.</p>
                                    <p style="margin-top: 20px;">
                                        Best regards,<br>
                                        <strong>${adminName}</strong><br>
                                        Lanvai AdExchange
                                    </p>
                                </div>
                                <div class="footer">
                                    <p>&copy; 2025 Lanvai | Smart Advertising Solutions</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `;
                    const emailText = `Dear ${inquiry.full_name},\n\nThank you for your interest in Lanvai ADExchange. We have reviewed your inquiry regarding ${inquiry.course}.\n\n${data.response}\n\nIf you have any further questions, feel free to reply to this email or contact us at support@lanvai.com.\n\nBest regards,\n${adminName}\nLanvai AdExchange`;
                    emailResult = await sendEmailReply(inquiry.email, emailSubject, emailHtml, emailText);
                }
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Inquiry updated successfully!',
                    affected_rows: result.affectedRows,
                    email_sent: emailResult.success,
                    email_error: emailResult.error
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Update AdExchange Inquiry Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}


// ===== GET AD EXCHANGE INQUIRIES - FIXED =====
async function handleGetAdExchangeInquiries(req, res) {
    console.log('[AdExchange Inquiries] Fetching all...');
    
    try {
        if (dbConnected && pool) {
            // Ensure table exists
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ad_exchange_inquiries (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    inquiry_type VARCHAR(50) NOT NULL,
                    course VARCHAR(255) NOT NULL,
                    message TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
                    response TEXT,
                    responded_at TIMESTAMP NULL,
                    admin_name VARCHAR(100),
                    email_sent BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_status (status),
                    INDEX idx_type (inquiry_type),
                    INDEX idx_created_at (created_at)
                )
            `);
            
            const urlParts = req.url.split('?');
            const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
            const type = params.type;
            const status = params.status;
            
            // FIXED: WHERE clause BEFORE ORDER BY
            let sql = 'SELECT * FROM ad_exchange_inquiries';
            let queryParams = [];
            let conditions = [];
            
            if (type && type !== 'all') {
                conditions.push('inquiry_type = ?');
                queryParams.push(type);
            }
            
            if (status && status !== 'all') {
                conditions.push('status = ?');
                queryParams.push(status);
            }
            
            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }
            
            // ORDER BY goes AFTER WHERE
            sql += ' ORDER BY created_at DESC';
            
            const [rows] = await pool.query(sql, queryParams);
            console.log('[AdExchange Inquiries] Found', rows.length, 'inquiries');
            
            sendJSON(res, 200, { 
                success: true,
                inquiries: rows,
                count: rows.length
            });
        } else {
            const inquiries = storage.adExchangeInquiries || [];
            sendJSON(res, 200, { 
                success: true,
                inquiries: inquiries,
                count: inquiries.length
            });
        }
    } catch (error) {
        console.error('[AdExchange Inquiries Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}



// ===== DELETE AD EXCHANGE INQUIRY =====
function handleDeleteAdExchangeInquiry(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Delete AdExchange Inquiry] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'Inquiry ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                // Soft delete - update status to 'deleted'
                const [result] = await pool.query(
                    `UPDATE ad_exchange_inquiries SET status = 'deleted' WHERE id = ?`,
                    [data.id]
                );
                
                console.log('[Delete AdExchange Inquiry] ✅ Soft deleted inquiry ID:', data.id);
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Inquiry deleted successfully',
                    affected_rows: result.affectedRows
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Delete AdExchange Inquiry Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== SIGNUP =====
async function handleSignup(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Signup] Received:', { email: data.email, fullName: data.fullName });
            
            // Validate required fields
            if (!data.email || !data.fullName || !data.password) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Email, full name, and password are required' 
                });
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Please enter a valid email address' 
                });
                return;
            }
            
            // Validate password (min 6 characters)
            if (data.password.length < 6) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Password must be at least 6 characters long' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Check if user already exists
            const [existingUsers] = await pool.query(
                'SELECT id, is_verified FROM users WHERE email = ?',
                [data.email.trim().toLowerCase()]
            );
            
            if (existingUsers && existingUsers.length > 0) {
                // If user exists but not verified, resend code
                if (!existingUsers[0].is_verified) {
                    const code = generateVerificationCode();
                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
                    
                    // Update the verification code
                    await pool.query(
                        'UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?',
                        [code, expiresAt, existingUsers[0].id]
                    );
                    
                    // Send verification email
                    const emailResult = await sendVerificationEmail(data.email.trim(), code);
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Verification code resent to your email',
                        email_sent: emailResult.success,
                        user_id: existingUsers[0].id,
                        verified: false
                    });
                    return;
                }
                
                sendJSON(res, 400, {
                    success: false,
                    error: 'An account with this email already exists. Please sign in instead.'
                });
                return;
            }
            
            // Generate verification code
            const code = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            
            // Create user
            const userIdGen = 'user_' + Math.random().toString(36).substring(2, 10);
            const [result] = await pool.query(
                `INSERT INTO users 
                 (user_id, full_name, email, password, verification_code, verification_expires, is_verified, user_type) 
                 VALUES (?, ?, ?, ?, ?, ?, FALSE, 'user')`,
                [
                    userIdGen,
                    data.fullName.trim(),
                    data.email.trim().toLowerCase(),
                    data.password,
                    code,
                    expiresAt
                ]
            );
            
            console.log('[Signup] ✅ User created! ID:', result.insertId);
            console.log('[Signup] 🔑 Verification code:', code);
            
            // Send verification email
            const emailResult = await sendVerificationEmail(data.email.trim(), code);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Account created! Please check your email for verification code.',
                email_sent: emailResult.success,
                user_id: result.insertId,
                verified: false
            });
            
        } catch (e) {
            console.error('[Signup Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ===== VERIFY CODE =====
async function handleVerifyCode(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Verify Code] Received:', { email: data.email, code: data.code });
            
            if (!data.email || !data.code) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Email and verification code are required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Check if user exists and get verification details
            const [users] = await pool.query(
                'SELECT id, verification_code, verification_expires, is_verified FROM users WHERE email = ?',
                [data.email.trim().toLowerCase()]
            );
            
            console.log('[Verify Code] User found:', users ? users.length : 0);
            
            if (!users || users.length === 0) {
                sendJSON(res, 404, { 
                    success: false, 
                    error: 'User not found' 
                });
                return;
            }
            
            const user = users[0];
            
            console.log('[Verify Code] User details:', {
                id: user.id,
                stored_code: user.verification_code,
                provided_code: data.code,
                is_verified: user.is_verified,
                expires: user.verification_expires
            });
            
            // Check if already verified
            if (user.is_verified) {
                sendJSON(res, 200, {
                    success: true,
                    message: 'Account already verified',
                    verified: true
                });
                return;
            }
            
            // Check if code matches
            if (user.verification_code !== data.code) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Invalid verification code. Please check and try again.' 
                });
                return;
            }
            
            // Check if code expired
            if (new Date(user.verification_expires) < new Date()) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Verification code has expired. Please request a new code.' 
                });
                return;
            }
            
            // Mark user as verified
            await pool.query(
                'UPDATE users SET is_verified = TRUE, verification_code = NULL, verification_expires = NULL WHERE id = ?',
                [user.id]
            );
            
            console.log('[Verify Code] ✅ User verified! ID:', user.id);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Account verified successfully! Please sign in.',
                verified: true
            });
            
        } catch (e) {
            console.error('[Verify Code Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ===== RESEND VERIFICATION CODE =====
async function handleResendCode(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Resend Code] Received:', data);
            
            if (!data.email) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Email is required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            const [users] = await pool.query(
                'SELECT id, is_verified FROM users WHERE email = ?',
                [data.email.trim().toLowerCase()]
            );
            
            if (!users || users.length === 0) {
                sendJSON(res, 404, { 
                    success: false, 
                    error: 'User not found' 
                });
                return;
            }
            
            if (users[0].is_verified) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Account is already verified. Please sign in.' 
                });
                return;
            }
            
            const code = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            
            await pool.query(
                'UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?',
                [code, expiresAt, users[0].id]
            );
            
            console.log('[Resend Code] 🔑 New verification code:', code);
            
            const emailResult = await sendVerificationEmail(data.email.trim(), code);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Verification code resent to your email',
                email_sent: emailResult.success
            });
            
        } catch (e) {
            console.error('[Resend Code Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ===== SIGNIN =====
async function handleSignin(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        let responseSent = false;
        
        try {
            const data = JSON.parse(body);
            console.log('[Signin] Received:', data);
            
            if (!data.email || !data.password) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 400, { 
                        success: false, 
                        error: 'Email and password are required' 
                    });
                }
                return;
            }
            
            if (!dbConnected || !pool) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 500, { 
                        success: false, 
                        error: 'Database not connected' 
                    });
                }
                return;
            }
            
            // Check if user exists
            const [users] = await pool.query(
                'SELECT id, user_id, full_name, email, password, is_verified FROM users WHERE email = ?',
                [data.email.trim().toLowerCase()]
            );
            
            if (!users || users.length === 0) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 401, { 
                        success: false, 
                        error: 'Invalid email or password' 
                    });
                }
                return;
            }
            
            const user = users[0];
            
            // Check password (plain text for now - use bcrypt in production)
            if (user.password !== data.password) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 401, { 
                        success: false, 
                        error: 'Invalid email or password' 
                    });
                }
                return;
            }
            
            // Check if verified
            if (!user.is_verified) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 403, { 
                        success: false, 
                        error: 'Please verify your email first. Check your inbox for the verification code.',
                        verified: false,
                        user_id: user.id
                    });
                }
                return;
            }
            
            // Generate session token (simple for now)
            const sessionToken = 'session_' + Math.random().toString(36).substring(2, 18);
            
            // Store session in memory
            global.sessions = global.sessions || {};
            global.sessions[sessionToken] = {
                user_id: user.id,
                user_id_display: user.user_id,
                full_name: user.full_name,
                email: user.email,
                created_at: new Date().toISOString()
            };
            
            console.log('[Signin] ✅ User signed in:', user.email);
            
            if (!responseSent) {
                responseSent = true;
                sendJSON(res, 200, {
                    success: true,
                    message: 'Sign in successful!',
                    user: {
                        id: user.id,
                        user_id: user.user_id,
                        full_name: user.full_name,
                        email: user.email
                    },
                    session_token: sessionToken,
                    redirect: '/wallet.html'
                });
            }
            
        } catch (e) {
            console.error('[Signin Error]', e);
            if (!responseSent) {
                responseSent = true;
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Invalid request: ' + e.message 
                });
            }
        }
    });
}

// ==============================================
// FORGOT PASSWORD - SEND RESET LINK
// ==============================================
async function handleForgotPassword(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Forgot Password] Received:', data.email);
            
            if (!data.email) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Email address is required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Check if user exists
            const [users] = await pool.query(
                'SELECT id, email, full_name FROM users WHERE email = ?',
                [data.email.trim().toLowerCase()]
            );
            
            if (!users || users.length === 0) {
                // Don't reveal if email exists or not for security
                sendJSON(res, 200, {
                    success: true,
                    message: 'If an account exists with this email, a reset link has been sent.'
                });
                return;
            }
            
            const user = users[0];
            
            // Generate reset token (6-digit code for simplicity)
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            
            // Store reset token in database
            await pool.query(
                `UPDATE users SET 
                 reset_password_code = ?, 
                 reset_password_expires = ? 
                 WHERE id = ?`,
                [resetCode, expiresAt, user.id]
            );
            
            console.log('[Forgot Password] Reset code for', user.email, ':', resetCode);
            
            // Send email with reset link
            try {
               const resetLink = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password.html?code=${resetCode}&email=${encodeURIComponent(user.email)}`;
                
                const emailSubject = 'Password Reset - Lanvai Institution';
                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Reset Your Password</title>
                        <style>
                            body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f59e0b; }
                            .header h1 { color: #1e3a5f; }
                            .content { padding: 20px 0; color: #333; line-height: 1.6; }
                            .code-box { background: #fffbeb; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 5px; margin: 15px 0; border: 1px solid #f59e0b; }
                            .btn-reset { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: 600; margin: 15px 0; }
                            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
                            .logo-text { font-size: 20px; font-weight: bold; color: #7c3aed; }
                            .logo-text span { color: #6d28d9; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo-text">Lanvai <span>Institution</span></div>
                                <p style="color: #64748b;">Password Reset Request</p>
                            </div>
                            <div class="content">
                                <p>Dear <strong>${user.full_name || 'User'}</strong>,</p>
                                <p>We received a request to reset your password for your institution account.</p>
                                <p>Use the verification code below to reset your password:</p>
                                <div class="code-box">${resetCode}</div>
                                <p>Or click the button below:</p>
                                <div style="text-align: center;">
                                    <a href="${resetLink}" class="btn-reset">🔑 Reset Password</a>
                                </div>
                                <p style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                                    This code will expire in <strong>15 minutes</strong>.
                                </p>
                                <p>If you didn't request this, please ignore this email.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2025 Lanvai | Smart Solutions for Smart Businesses</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;
                
                const emailText = `Password Reset - Lanvai Institution\n\nDear ${user.full_name || 'User'},\n\nWe received a request to reset your password.\n\nYour verification code is: ${resetCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`;
                
                await sendEmailReply(user.email, emailSubject, emailHtml, emailText);
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Password reset link sent to your email'
                });
                
            } catch (emailError) {
                console.error('[Forgot Password] Email error:', emailError);
                // Still return success even if email fails (for security)
                sendJSON(res, 200, {
                    success: true,
                    message: 'If an account exists with this email, a reset link has been sent.'
                });
            }
            
        } catch (e) {
            console.error('[Forgot Password Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ==============================================
// RESET PASSWORD - UPDATE WITH CODE
// ==============================================
async function handleResetPassword(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Reset Password] Received:', { email: data.email, code: data.code });
            
            if (!data.email || !data.code || !data.newPassword) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Email, verification code, and new password are required' 
                });
                return;
            }
            
            if (data.newPassword.length < 6) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Password must be at least 6 characters long' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Find user by email and reset code
            const [users] = await pool.query(
                `SELECT id, email, reset_password_code, reset_password_expires 
                 FROM users 
                 WHERE email = ? AND reset_password_code = ?`,
                [data.email.trim().toLowerCase(), data.code]
            );
            
            if (!users || users.length === 0) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Invalid verification code or email' 
                });
                return;
            }
            
            const user = users[0];
            
            // Check if code expired
            if (new Date(user.reset_password_expires) < new Date()) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Verification code has expired. Please request a new one.' 
                });
                return;
            }
            
            // Update password
            await pool.query(
                `UPDATE users SET 
                 password = ?, 
                 reset_password_code = NULL, 
                 reset_password_expires = NULL 
                 WHERE id = ?`,
                [data.newPassword, user.id]
            );
            
            console.log('[Reset Password] ✅ Password reset for:', user.email);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Password reset successfully! Please sign in with your new password.'
            });
            
        } catch (e) {
            console.error('[Reset Password Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}



// ==============================================
// VERIFY RESET CODE - Check if code is valid
// ==============================================
async function handleVerifyResetCode(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const email = params.email;
        const code = params.code;
        
        if (!email || !code) {
            sendJSON(res, 400, { 
                success: false, 
                error: 'Email and verification code are required' 
            });
            return;
        }
        
        if (!dbConnected || !pool) {
            sendJSON(res, 500, { 
                success: false, 
                error: 'Database not connected' 
            });
            return;
        }
        
        const [users] = await pool.query(
            `SELECT id, reset_password_code, reset_password_expires 
             FROM users 
             WHERE email = ? AND reset_password_code = ?`,
            [email.trim().toLowerCase(), code]
        );
        
        if (!users || users.length === 0) {
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid verification code' 
            });
            return;
        }
        
        const user = users[0];
        
        if (new Date(user.reset_password_expires) < new Date()) {
            sendJSON(res, 400, { 
                success: false, 
                error: 'Verification code has expired' 
            });
            return;
        }
        
        sendJSON(res, 200, {
            success: true,
            message: 'Verification code is valid'
        });
        
    } catch (error) {
        console.error('[Verify Reset Code Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message 
        });
    }
}

// ==============================================
// ADMIN SERVICE MANAGEMENT ENDPOINTS
// ==============================================

// ===== ADMIN: ADD SERVICE =====
async function handleAddService(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Add Service] Received:', data);
            
            if (!data.title || !data.category || !data.service_type || !data.description) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Title, category, service_type, and description are required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Check if service already exists
            const [existing] = await pool.query(
                'SELECT id FROM expert_services WHERE title = ? AND category = ? AND service_type = ? AND business_category = ?',
                [data.title.trim(), data.category, data.service_type, data.business_category || 'General']
            );
            
            if (existing && existing.length > 0) {
                // If exists, update it instead
                const [result] = await pool.query(
                    `UPDATE expert_services SET 
                     description = ?, icon = ?, is_active = ? 
                     WHERE title = ? AND category = ? AND service_type = ? AND business_category = ?`,
                    [
                        data.description.trim(),
                        data.icon || 'fa-cog',
                        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
                        data.title.trim(),
                        data.category,
                        data.service_type,
                        data.business_category || 'General'
                    ]
                );
                console.log('[Admin Add Service] ✅ Updated existing service');
                sendJSON(res, 200, {
                    success: true,
                    message: 'Service updated successfully',
                    id: existing[0].id
                });
                return;
            }
            
            const [result] = await pool.query(
                `INSERT INTO expert_services 
                 (category, service_type, title, description, icon, business_category, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.category,
                    data.service_type,
                    data.title.trim(),
                    data.description.trim(),
                    data.icon || 'fa-cog',
                    data.business_category || 'General',
                    data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
                ]
            );
            
            console.log('[Admin Add Service] ✅ Added service ID:', result.insertId);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Service added successfully',
                id: result.insertId
            });
            
        } catch (e) {
            console.error('[Admin Add Service Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ===== ADMIN: UPDATE SERVICE =====
async function handleUpdateService(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Update Service] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Service ID is required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Parse the ID to find the database record
            const parts = data.id.split('_');
            if (parts.length < 3) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Invalid service ID format' 
                });
                return;
            }
            
            const serviceType = parts[0];
            const businessCategory = parts.slice(1, -1).join('_');
            const index = parseInt(parts[parts.length - 1]);
            
            // Map service type to service_type field
            const serviceTypeMap = {
                'marketingServices': 'marketing_services',
                'marketingStrategies': 'marketing_strategies',
                'restructuringServices': 'restructuring_services',
                'restructuringStrategies': 'restructuring_strategies'
            };
            
            const mappedServiceType = serviceTypeMap[serviceType];
            if (!mappedServiceType) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Invalid service type' 
                });
                return;
            }
            
            // Find the service
            const [rows] = await pool.query(
                `SELECT * FROM expert_services WHERE business_category = ? AND service_type = ? AND is_active = TRUE`,
                [businessCategory, mappedServiceType]
            );
            
            if (!rows || rows.length === 0 || index >= rows.length) {
                sendJSON(res, 404, { 
                    success: false, 
                    error: 'Service not found' 
                });
                return;
            }
            
            const serviceId = rows[index].id;
            
            let updates = [];
            let params = [];
            
            if (data.title) { updates.push('title = ?'); params.push(data.title.trim()); }
            if (data.description) { updates.push('description = ?'); params.push(data.description.trim()); }
            if (data.icon) { updates.push('icon = ?'); params.push(data.icon); }
            if (data.business_category) { updates.push('business_category = ?'); params.push(data.business_category); }
            if (data.is_active !== undefined) { updates.push('is_active = ?'); params.push(data.is_active ? 1 : 0); }
            
            if (updates.length === 0) {
                sendJSON(res, 400, { success: false, error: 'No fields to update' });
                return;
            }
            
            params.push(serviceId);
            const [result] = await pool.query(
                `UPDATE expert_services SET ${updates.join(', ')} WHERE id = ?`,
                params
            );
            
            console.log('[Admin Update Service] ✅ Updated service ID:', serviceId);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Service updated successfully',
                affected_rows: result.affectedRows
            });
            
        } catch (e) {
            console.error('[Admin Update Service Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ===== ADMIN: DELETE SERVICE =====
async function handleDeleteService(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Delete Service] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Service ID is required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Parse the ID to extract information
            const parts = data.id.split('_');
            if (parts.length < 3) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Invalid service ID format' 
                });
                return;
            }
            
            const serviceType = parts[0];
            const businessCategory = parts.slice(1, -1).join('_');
            const index = parseInt(parts[parts.length - 1]);
            
            console.log('[Admin Delete Service] Parsed:', { serviceType, businessCategory, index });
            
            // Map service type to service_type field
            const serviceTypeMap = {
                'marketingServices': 'marketing_services',
                'marketingStrategies': 'marketing_strategies',
                'restructuringServices': 'restructuring_services',
                'restructuringStrategies': 'restructuring_strategies'
            };
            
            const mappedServiceType = serviceTypeMap[serviceType];
            if (!mappedServiceType) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Invalid service type' 
                });
                return;
            }
            
            // Find the service by business category and service type
            const [rows] = await pool.query(
                `SELECT * FROM expert_services WHERE business_category = ? AND service_type = ? AND is_active = TRUE`,
                [businessCategory, mappedServiceType]
            );
            
            if (!rows || rows.length === 0 || index >= rows.length) {
                sendJSON(res, 404, {
                    success: false,
                    error: 'Service not found'
                });
                return;
            }
            
            const serviceId = rows[index].id;
            
            // Soft delete - mark as inactive
            await pool.query(
                `UPDATE expert_services SET is_active = FALSE WHERE id = ?`,
                [serviceId]
            );
            
            console.log('[Admin Delete Service] ✅ Soft deleted service ID:', serviceId);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Service deleted successfully'
            });
            
        } catch (e) {
            console.error('[Admin Delete Service Error]', e);
            sendJSON(res, 500, { 
                success: false, 
                error: 'Server error: ' + e.message 
            });
        }
    });
}

// ===== CHECK SESSION =====
async function handleCheckSession(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const token = params.token;
        
        if (!token) {
            sendJSON(res, 401, { 
                success: false, 
                error: 'No session token provided' 
            });
            return;
        }
        
        global.sessions = global.sessions || {};
        const session = global.sessions[token];
        
        if (!session) {
            sendJSON(res, 401, { 
                success: false, 
                error: 'Invalid or expired session' 
            });
            return;
        }
        
        sendJSON(res, 200, {
            success: true,
            user: session,
            redirect: '/wallet.html'
        });
        
    } catch (error) {
        console.error('[Check Session Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message 
        });
    }
}

// ===== LOGOUT =====
async function handleLogout(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const token = data.token;
            
            global.sessions = global.sessions || {};
            if (token && global.sessions[token]) {
                delete global.sessions[token];
            }
            
            sendJSON(res, 200, {
                success: true,
                message: 'Logged out successfully'
            });
            
        } catch (e) {
            console.error('[Logout Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request' 
            });
        }
    });
}

// ==============================================
// INSTITUTION AUTH HANDLERS
// ==============================================

// ===== INSTITUTION SIGNUP =====
async function handleInstitutionSignup(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Institution Signup] Received:', { 
                email: data.email, 
                institution_name: data.institution_name 
            });
            
            // Validate required fields
            if (!data.email || !data.institution_name || !data.password || !data.admin_name) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Email, institution name, admin name, and password are required' 
                });
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Please enter a valid email address' 
                });
                return;
            }
            
            // Validate password (min 6 characters)
            if (data.password.length < 6) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Password must be at least 6 characters long' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Check if user already exists
            const [existingUsers] = await pool.query(
                'SELECT id, is_verified, user_role FROM users WHERE email = ?',
                [data.email.trim().toLowerCase()]
            );
            
            if (existingUsers && existingUsers.length > 0) {
                // If user exists but not verified, resend code
                if (!existingUsers[0].is_verified) {
                    const code = generateVerificationCode();
                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
                    
                    await pool.query(
                        'UPDATE users SET verification_code = ?, verification_expires = ?, user_role = ? WHERE id = ?',
                        [code, expiresAt, 'institution', existingUsers[0].id]
                    );
                    
                    const emailResult = await sendVerificationEmail(data.email.trim(), code);
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Verification code resent to your email',
                        email_sent: emailResult.success,
                        user_id: existingUsers[0].id,
                        verified: false,
                        user_role: 'institution'
                    });
                    return;
                }
                
                sendJSON(res, 400, {
                    success: false,
                    error: 'An account with this email already exists. Please sign in instead.'
                });
                return;
            }
            
            // Generate verification code
            const code = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            
            // Create institution user
            const userIdGen = 'inst_' + Math.random().toString(36).substring(2, 10);
            
            // Build branches JSON
            const branches = data.branches || [];
            const verificationDocs = data.verification_docs || {};
            
            const [result] = await pool.query(
                `INSERT INTO users 
                 (user_id, full_name, email, password, user_type, user_role, 
                  institution_name, institution_type, institution_reg_number, 
                  institution_branches, institution_website, institution_logo,
                  institution_verified, institution_verification_docs,
                  verification_code, verification_expires, is_verified) 
                 VALUES (?, ?, ?, ?, 'institution', 'institution', ?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?, FALSE)`,
                [
                    userIdGen,
                    data.admin_name.trim(),
                    data.email.trim().toLowerCase(),
                    data.password,
                    data.institution_name.trim(),
                    data.institution_type || '',
                    data.reg_number || '',
                    JSON.stringify(branches),
                    data.website || '',
                    data.logo || '',
                    JSON.stringify(verificationDocs),
                    code,
                    expiresAt
                ]
            );
            
            console.log('[Institution Signup] ✅ Institution created! ID:', result.insertId);
            console.log('[Institution Signup] 🔑 Verification code:', code);
            
            // Send verification email
            const emailResult = await sendVerificationEmail(data.email.trim(), code);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Institution account created! Please check your email for verification code.',
                email_sent: emailResult.success,
                user_id: result.insertId,
                verified: false,
                user_role: 'institution'
            });
            
        } catch (e) {
            console.error('[Institution Signup Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ===== INSTITUTION SIGNIN =====
async function handleInstitutionSignin(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        let responseSent = false;
        
        try {
            const data = JSON.parse(body);
            console.log('[Institution Signin] Received:', data);
            
            if (!data.email || !data.password) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 400, { 
                        success: false, 
                        error: 'Email and password are required' 
                    });
                }
                return;
            }
            
            if (!dbConnected || !pool) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 500, { 
                        success: false, 
                        error: 'Database not connected' 
                    });
                }
                return;
            }
            
            // Check if institution user exists
            const [users] = await pool.query(
                `SELECT id, user_id, full_name, email, password, is_verified, user_role,
                        institution_name, institution_type, institution_reg_number,
                        institution_branches, institution_website, institution_logo,
                        institution_verified
                 FROM users 
                 WHERE email = ? AND (user_role = 'institution' OR user_type = 'institution')`,
                [data.email.trim().toLowerCase()]
            );
            
            if (!users || users.length === 0) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 401, { 
                        success: false, 
                        error: 'No institution account found with this email' 
                    });
                }
                return;
            }
            
            const user = users[0];
            
            // Check password
            if (user.password !== data.password) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 401, { 
                        success: false, 
                        error: 'Invalid email or password' 
                    });
                }
                return;
            }
            
            // Check if verified
            if (!user.is_verified) {
                if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 403, { 
                        success: false, 
                        error: 'Please verify your email first. Check your inbox for the verification code.',
                        verified: false,
                        user_id: user.id,
                        user_role: 'institution'
                    });
                }
                return;
            }
            
            // Generate session token
            const sessionToken = 'inst_session_' + Math.random().toString(36).substring(2, 18);
            
            // Store session in memory
            global.sessions = global.sessions || {};
            global.sessions[sessionToken] = {
                user_id: user.id,
                user_id_display: user.user_id,
                full_name: user.full_name,
                email: user.email,
                user_role: 'institution',
                institution_name: user.institution_name,
                institution_type: user.institution_type,
                institution_verified: user.institution_verified,
                created_at: new Date().toISOString()
            };
            
            console.log('[Institution Signin] ✅ Institution signed in:', user.email);
            
            if (!responseSent) {
                responseSent = true;
                sendJSON(res, 200, {
                    success: true,
                    message: 'Institution sign in successful!',
                    user: {
                        id: user.id,
                        user_id: user.user_id,
                        full_name: user.full_name,
                        email: user.email,
                        user_role: 'institution',
                        institution_name: user.institution_name,
                        institution_type: user.institution_type,
                        institution_verified: user.institution_verified
                    },
                    session_token: sessionToken,
                    redirect: '/institution-dashboard.html'
                });
            }
            
        } catch (e) {
            console.error('[Institution Signin Error]', e);
            if (!responseSent) {
                responseSent = true;
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Invalid request: ' + e.message 
                });
            }
        }
    });
}

// ===== INSTITUTION VERIFICATION STATUS =====
async function handleInstitutionStatus(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const token = params.token;
        
        if (!token) {
            sendJSON(res, 401, { 
                success: false, 
                error: 'No session token provided' 
            });
            return;
        }
        
        global.sessions = global.sessions || {};
        const session = global.sessions[token];
        
        if (!session || session.user_role !== 'institution') {
            sendJSON(res, 401, { 
                success: false, 
                error: 'Invalid or expired session' 
            });
            return;
        }
        
        // Get updated institution data
        if (dbConnected && pool) {
            const [users] = await pool.query(
                `SELECT id, institution_name, institution_type, institution_verified,
                        institution_reg_number, institution_branches, institution_website
                 FROM users WHERE id = ?`,
                [session.user_id]
            );
            
            if (users && users.length > 0) {
                sendJSON(res, 200, {
                    success: true,
                    institution: {
                        id: users[0].id,
                        name: users[0].institution_name,
                        type: users[0].institution_type,
                        verified: users[0].institution_verified === 1,
                        reg_number: users[0].institution_reg_number,
                        branches: users[0].institution_branches ? JSON.parse(users[0].institution_branches) : [],
                        website: users[0].institution_website
                    },
                    redirect: '/institution-dashboard.html'
                });
                return;
            }
        }
        
        sendJSON(res, 200, {
            success: true,
            institution: {
                name: session.institution_name,
                verified: session.institution_verified || false
            }
        });
        
    } catch (error) {
        console.error('[Institution Status Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message 
        });
    }
}
// ==============================================
// UPDATED INSTITUTION HOSTED HANDLER
// WITH NEW FIELDS: semesters, offers_certificate, pacing, topics, weekly_timetable
// ==============================================

async function handleInstitutionHosted(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Institution Hosted] Received:', JSON.stringify(data, null, 2));
            
            if (!data.institution || !data.email) {
                sendJSON(res, 400, { error: 'Institution name and email are required' });
                return;
            }
            
            if (!data.branches || data.branches.length === 0) {
                sendJSON(res, 400, { error: 'At least one branch is required' });
                return;
            }

            const visitorId = getVisitorId(req, res);

            if (!dbConnected || !pool) {
                console.log('[Institution Hosted] Database not connected, using fallback');
                storage.institutionHostedSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Data saved to memory (fallback)',
                    fallback: true,
                    courses_saved: countCourses(data.enrollmentTypes || {})
                });
                return;
            }

            try {
                // ===== 1. CREATE OR UPDATE INSTITUTION =====
                const [existing] = await pool.query('SELECT id FROM institutions WHERE email = ?', [data.email]);
                let institutionId;
                
                if (existing && existing.length > 0) {
                    institutionId = existing[0].id;
                    await pool.query(
                        `UPDATE institutions SET 
                         institution_name = ?, 
                         branches = ?, 
                         website = ?, 
                         about = ?,
                         achievements = ?,
                         is_active = TRUE,
                         updated_at = NOW()
                         WHERE id = ?`,
                        [
                            data.institution, 
                            JSON.stringify(data.branches), 
                            data.website || '',
                            data.about || '',
                            data.achievements || '',
                            institutionId
                        ]
                    );
                    console.log('[Institution Hosted] ✅ Updated existing institution ID:', institutionId);
                } else {
                    const [result] = await pool.query(
                        `INSERT INTO institutions 
                         (institution_name, branches, email, website, about, achievements, is_active, review_status) 
                         VALUES (?, ?, ?, ?, ?, ?, TRUE, 'approved')`,
                        [
                            data.institution, 
                            JSON.stringify(data.branches), 
                            data.email, 
                            data.website || '',
                            data.about || '',
                            data.achievements || ''
                        ]
                    );
                    institutionId = result.insertId;
                    console.log('[Institution Hosted] ✅ Created new institution ID:', institutionId);
                }

                // ===== 2. PROCESS BRANCHES =====
                let coursesSaved = 0;
                let branchMap = {};

                for (const branch of data.branches) {
                    // Check if branch exists
                    const [existingBranch] = await pool.query(
                        'SELECT id FROM institution_branches WHERE institution_id = ? AND name = ?',
                        [institutionId, branch.name]
                    );
                    
                    let branchId;
                    if (existingBranch && existingBranch.length > 0) {
                        branchId = existingBranch[0].id;
                        await pool.query(
                            `UPDATE institution_branches SET
                             logo_url = ?, website = ?, manual_address = ?, automatic_address = ?,
                             social_whatsapp = ?, social_instagram = ?, social_linkedin = ?, 
                             social_twitter = ?, social_telegram = ?, social_facebook = ?,
                             updated_at = NOW()
                             WHERE id = ?`,
                            [
                                branch.logo || null,
                                branch.website || null,
                                branch.manualAddress || null,
                                branch.automaticAddress || null,
                                branch.social?.whatsapp || null,
                                branch.social?.instagram || null,
                                branch.social?.linkedin || null,
                                branch.social?.twitter || null,
                                branch.social?.telegram || null,
                                branch.social?.facebook || null,
                                branchId
                            ]
                        );
                    } else {
                        const [result] = await pool.query(
                            `INSERT INTO institution_branches 
                             (institution_id, name, logo_url, website, manual_address, automatic_address,
                              social_whatsapp, social_instagram, social_linkedin, social_twitter, social_telegram, social_facebook) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                institutionId,
                                branch.name,
                                branch.logo || null,
                                branch.website || null,
                                branch.manualAddress || null,
                                branch.automaticAddress || null,
                                branch.social?.whatsapp || null,
                                branch.social?.instagram || null,
                                branch.social?.linkedin || null,
                                branch.social?.twitter || null,
                                branch.social?.telegram || null,
                                branch.social?.facebook || null
                            ]
                        );
                        branchId = result.insertId;
                    }
                    branchMap[branch.name] = branchId;
                }

                // ===== 3. PROCESS COURSES =====
                const enrollmentTypes = data.enrollmentTypes || {};
                
                for (const [enrollType, courses] of Object.entries(enrollmentTypes)) {
                    for (const course of courses) {
                        // Skip if required fields are missing
                        if (!course.name || !course.period || !course.category || 
                            !course.branch || !course.programType || !course.costPerYear || 
                            !course.intakeDate || !course.semesters || !course.certificate || !course.pacing) {
                            console.log('[Institution Hosted] Skipping incomplete course:', course.name);
                            continue;
                        }

                        const branchId = branchMap[course.branch];
                        if (!branchId) {
                            console.log('[Institution Hosted] ⚠️ Branch not found for course:', course.name, 'Branch:', course.branch);
                            continue;
                        }

                        // Parse enrollment type
                        const [mode, schedule, type] = parseEnrollmentType(enrollType);

                        // Insert course with all new fields
                        const [courseResult] = await pool.query(
                            `INSERT INTO courses (
                                branch_id, institution_id,
                                course_name, cluster_points, period_years,
                                category, program_type,
                                semesters, offers_certificate, pacing,
                                cost_per_year, intake_date,
                                enrollment_mode, enrollment_schedule, enrollment_type
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                branchId,
                                institutionId,
                                course.name,
                                course.cluster || null,
                                parseFloat(course.period) || 1,
                                course.category,
                                course.programType,
                                parseInt(course.semesters) || 1,
                                course.certificate === 'Yes' ? 1 : 0,
                                course.pacing,
                                parseFloat(course.costPerYear) || 0,
                                course.intakeDate,
                                mode,
                                schedule,
                                type
                            ]
                        );

                        const courseId = courseResult.insertId;
                        coursesSaved++;

                        // ===== 4. INSERT SELF-PACED TOPICS =====
                        if (course.pacing === 'Self-paced' && course.topics && course.topics.length > 0) {
                            for (const topic of course.topics) {
                                if (topic.name) {
                                    await pool.query(
                                        `INSERT INTO course_topics (
                                            course_id, topic_name, video_url, pdf_url
                                        ) VALUES (?, ?, ?, ?)`,
                                        [
                                            courseId,
                                            topic.name,
                                            topic.video || null,
                                            topic.pdf || null
                                        ]
                                    );
                                }
                            }
                            console.log('[Institution Hosted] ✅ Added', course.topics.length, 'topics for course:', course.name);
                        }

                        // ===== 5. INSERT WEEKLY TIMETABLE =====
                        if (course.pacing === 'Semester Live' && course.weeklyTimetable) {
                            await pool.query(
                                `INSERT INTO course_weekly_timetables (
                                    course_id, timetable_file
                                ) VALUES (?, ?)`,
                                [courseId, course.weeklyTimetable]
                            );
                            console.log('[Institution Hosted] ✅ Added weekly timetable for course:', course.name);
                        }
                    }
                }
                
                console.log('[Institution Hosted] ✅ Saved', coursesSaved, 'courses to database');
                
                sendJSON(res, 200, {
                    success: true,
                    message: `Institution "${data.institution}" registered successfully with ${coursesSaved} courses!`,
                    institution_id: institutionId,
                    courses_saved: coursesSaved
                });
                
            } catch (err) {
                console.error('[Institution Hosted DB Error]', err);
                console.error('[Institution Hosted] SQL Error:', err.sql);
                console.error('[Institution Hosted] SQL Message:', err.sqlMessage);
                
                // Save to memory as fallback
                storage.institutionHostedSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Data saved (database error - using fallback)',
                    fallback: true,
                    error: err.sqlMessage || err.message,
                    courses_saved: countCourses(data.enrollmentTypes || {})
                });
            }
        } catch (e) {
            console.error('[Institution Hosted Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// Helper function to count courses
function countCourses(enrollmentTypes) {
    let count = 0;
    for (const courses of Object.values(enrollmentTypes)) {
        count += courses.length;
    }
    return count;
}

// Helper function to parse enrollment type
function parseEnrollmentType(enrollType) {
    const map = {
        'onlineRollingFulltime': ['online', 'rolling', 'fulltime'],
        'onlineRollingParttime': ['online', 'rolling', 'parttime'],
        'onlineIntakeFulltime': ['online', 'intake', 'fulltime'],
        'onlineIntakeParttime': ['online', 'intake', 'parttime'],
        'physicalRollingFulltime': ['physical', 'rolling', 'fulltime'],
        'physicalRollingParttime': ['physical', 'rolling', 'parttime'],
        'physicalIntakeFulltime': ['physical', 'intake', 'fulltime'],
        'physicalIntakeParttime': ['physical', 'intake', 'parttime']
    };
    return map[enrollType] || ['online', 'rolling', 'fulltime'];
}

// ========== DATABASE CONNECTION ==========
let pool = null;
let dbConnected = false;

async function initDatabase() {
    try {
        const mysql = require('mysql2/promise');
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lanvai_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully!');
        dbConnected = true;
        connection.release();
        
        await createTables();
        return true;
    } catch (err) {
        console.log('❌ MySQL connection failed:', err.message);
        console.log('⚠️ Using in-memory storage (fallback mode)');
        dbConnected = false;
        return false;
    }
}

// ========== CREATE TABLES ==========
async function createTables() {
    try {
        // 1. Create USERS table first (no dependencies)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) UNIQUE,
                full_name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                user_type VARCHAR(50),
                user_role VARCHAR(50) DEFAULT 'user',
                institution_name VARCHAR(255),
                institution_type VARCHAR(100),
                institution_reg_number VARCHAR(100),
                institution_branches JSON,
                institution_website VARCHAR(255),
                institution_logo VARCHAR(500),
                institution_verified BOOLEAN DEFAULT FALSE,
                institution_verification_docs JSON,
                verification_code VARCHAR(10),
                verification_expires TIMESTAMP NULL,
                reset_password_code VARCHAR(10),
                reset_password_expires TIMESTAMP NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2. Create INSTITUTIONS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS institutions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                institution_name VARCHAR(255) NOT NULL,
                branches JSON,
                email VARCHAR(255) UNIQUE,
                website VARCHAR(255),
                about TEXT,
                achievements TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                review_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 3. Create INSTITUTION BRANCHES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS institution_branches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                institution_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                logo_url VARCHAR(500),
                website VARCHAR(500),
                manual_address TEXT,
                automatic_address TEXT,
                social_whatsapp VARCHAR(255),
                social_instagram VARCHAR(255),
                social_linkedin VARCHAR(255),
                social_twitter VARCHAR(255),
                social_telegram VARCHAR(255),
                social_facebook VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
                INDEX idx_institution_id (institution_id)
            )
        `);

        // 4. Create COURSES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                branch_id INT NOT NULL,
                institution_id INT NOT NULL,
                course_name VARCHAR(255) NOT NULL,
                cluster_points VARCHAR(50),
                period_years DECIMAL(5,2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                program_type VARCHAR(100) NOT NULL,
                semesters INT NOT NULL,
                offers_certificate BOOLEAN DEFAULT FALSE,
                pacing VARCHAR(50) NOT NULL CHECK (pacing IN ('Self-paced', 'Semester Live')),
                cost_per_year DECIMAL(12,2) NOT NULL,
                intake_date DATE NOT NULL,
                enrollment_mode VARCHAR(50) NOT NULL CHECK (enrollment_mode IN ('online', 'physical', 'hybrid')),
                enrollment_schedule VARCHAR(50) NOT NULL CHECK (enrollment_schedule IN ('rolling', 'intake')),
                enrollment_type VARCHAR(50) NOT NULL CHECK (enrollment_type IN ('fulltime', 'parttime', 'both')),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES institution_branches(id) ON DELETE CASCADE,
                FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
                INDEX idx_branch_id (branch_id),
                INDEX idx_institution_id (institution_id),
                INDEX idx_intake_date (intake_date),
                INDEX idx_pacing (pacing)
            )
        `);

        // 5. Create COURSE TOPICS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_topics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                topic_name VARCHAR(255) NOT NULL,
                video_url VARCHAR(500),
                pdf_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                INDEX idx_course_id (course_id)
            )
        `);

        // 6. Create COURSE WEEKLY TIMETABLES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_weekly_timetables (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                timetable_file VARCHAR(500) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                INDEX idx_course_id (course_id)
            )
        `);

        // 7. Create INSTITUTION HOSTED COURSES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS institution_hosted_courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                institution_id INT,
                enrollment_type VARCHAR(50),
                course_name VARCHAR(255) NOT NULL,
                cluster_points VARCHAR(50),
                period_years DECIMAL(3,1),
                category VARCHAR(100),
                branch_offering VARCHAR(255),
                program_type VARCHAR(100),
                cost_per_year DECIMAL(10,2),
                intake_date VARCHAR(50),
                realtime_videos JSON,
                status VARCHAR(50) DEFAULT 'active',
                views INT DEFAULT 0,
                clicks INT DEFAULT 0,
                students INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
            )
        `);

        // 8. Create LANVAI HOSTED COURSES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lanvai_hosted_courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                institution_name VARCHAR(255),
                email VARCHAR(255),
                logo_url VARCHAR(500),
                about_us TEXT,
                achievements TEXT,
                consent_10_percent BOOLEAN DEFAULT FALSE,
                course_name VARCHAR(255),
                price DECIMAL(10,2),
                semesters INT,
                certification_body VARCHAR(255),
                category VARCHAR(100),
                delivery_mode VARCHAR(50),
                admission VARCHAR(100),
                study VARCHAR(50),
                course_type VARCHAR(50),
                topics JSON,
                timetable_files JSON,
                review_status VARCHAR(50) DEFAULT 'pending',
                is_active BOOLEAN DEFAULT TRUE,
                enrollment_type VARCHAR(50) DEFAULT 'onlineRollingFulltime',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 9. Create COURSE INQUIRIES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_inquiries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                course VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                response TEXT,
                responded_at TIMESTAMP NULL,
                email_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        `);

        // 10. Create LANVAI INQUIRIES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lanvai_inquiries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                response TEXT,
                responded_at TIMESTAMP NULL,
                email_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        `);

        // 11. Create QUOTE REQUESTS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS quote_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                company VARCHAR(255),
                service_type VARCHAR(100) NOT NULL,
                business_category VARCHAR(100) NOT NULL,
                budget VARCHAR(50),
                message TEXT NOT NULL,
                response TEXT,
                admin_name VARCHAR(100),
                status ENUM('pending', 'responded') DEFAULT 'pending',
                email_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_service_type (service_type),
                INDEX idx_created_at (created_at)
            )
        `);

        // 12. Create AD EXCHANGE INQUIRIES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ad_exchange_inquiries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                inquiry_type VARCHAR(50) NOT NULL,
                course VARCHAR(255) NOT NULL,
                message TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                response TEXT,
                responded_at TIMESTAMP NULL,
                admin_name VARCHAR(100),
                email_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_type (inquiry_type),
                INDEX idx_created_at (created_at)
            )
        `);

        // 13. Create AD EXCHANGE SELECTIONS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ad_exchange_selections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visitor_id VARCHAR(50),
                category VARCHAR(100),
                selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 14. Create EXPERT SERVICES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expert_services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(100),
                service_type VARCHAR(100),
                title VARCHAR(255),
                description TEXT,
                icon VARCHAR(50),
                business_category VARCHAR(100) DEFAULT 'General',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 15. Create AD PACKAGES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ad_packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                package_name VARCHAR(255),
                category VARCHAR(50),
                price DECIMAL(10,2),
                impressions_estimate INT,
                description TEXT,
                duration_days INT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 16. Create BRANCHES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS branches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                phone VARCHAR(50),
                email VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 17. Create MEDIA SUBMISSIONS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS media_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visitor_id VARCHAR(50),
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                submission_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 18. Create EXPERT CONSULTATIONS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expert_consultations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visitor_id VARCHAR(50),
                business_category VARCHAR(100) NOT NULL,
                business_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                consultation_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 19. Create MEDIA NEWS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS media_news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                date DATE NOT NULL,
                alert VARCHAR(50) NOT NULL DEFAULT 'not-causing',
                description TEXT NOT NULL,
                source VARCHAR(255),
                image LONGTEXT,
                content_type VARCHAR(50) DEFAULT 'Marketing',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_alert (alert),
                INDEX idx_date (date),
                INDEX idx_content_type (content_type)
            )
        `);

        // 20. Create MEDIA INSIGHTS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS media_insights (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                type VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                author VARCHAR(255),
                image LONGTEXT,
                content_type VARCHAR(50) DEFAULT 'Marketing',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_type (type),
                INDEX idx_content_type (content_type)
            )
        `);

        // 21. Create LIBRARY BOOKS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS library_books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                genre VARCHAR(100),
                price DECIMAL(10, 2),
                book_type VARCHAR(50) DEFAULT 'ebook',
                year_published INT,
                description TEXT,
                cover_image VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 22. Create BOOK CATEGORIES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS book_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 23. Create BOOK SUBMISSIONS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS book_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                book_type VARCHAR(50),
                price DECIMAL(10, 2),
                year_published INT,
                genre VARCHAR(100),
                other_books TEXT,
                phone VARCHAR(50),
                email VARCHAR(255),
                submission_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 24. Create PAGE VIEWS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS page_views (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visitor_id VARCHAR(50),
                page_url VARCHAR(500),
                page_title VARCHAR(255),
                referrer_url VARCHAR(500),
                time_spent INT DEFAULT 0,
                ip_address VARCHAR(50),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_visitor_id (visitor_id),
                INDEX idx_page_url (page_url)
            )
        `);

        // 25. Create CLICK EVENTS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS click_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visitor_id VARCHAR(50),
                element_id VARCHAR(255),
                element_class VARCHAR(255),
                element_text TEXT,
                page_url VARCHAR(500),
                ip_address VARCHAR(50),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_visitor_id (visitor_id),
                INDEX idx_element_id (element_id)
            )
        `);

        // 26. Create FORM SUBMISSIONS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS form_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visitor_id VARCHAR(50),
                form_type VARCHAR(100),
                form_data JSON,
                ip_address VARCHAR(50),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_visitor_id (visitor_id),
                INDEX idx_form_type (form_type)
            )
        `);

        // 27. Create DAILY STATS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                stat_date DATE UNIQUE,
                total_visitors INT DEFAULT 0,
                total_page_views INT DEFAULT 0,
                total_clicks INT DEFAULT 0,
                total_submissions INT DEFAULT 0,
                unique_visitors INT DEFAULT 0,
                avg_session_duration INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_stat_date (stat_date)
            )
        `);

        // 28. Create ADMIN LOGINS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_logins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100),
                ip_address VARCHAR(50),
                user_agent TEXT,
                login_status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 29. Create PAYMENTS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_id VARCHAR(50) UNIQUE,
                user_id VARCHAR(50),
                user_email VARCHAR(255),
                user_phone VARCHAR(50),
                amount DECIMAL(10,2),
                currency VARCHAR(10) DEFAULT 'KES',
                payment_method VARCHAR(50),
                payment_type VARCHAR(50) DEFAULT 'deposit',
                status VARCHAR(50) DEFAULT 'pending',
                reference VARCHAR(255),
                intasend_payment_id VARCHAR(100),
                intasend_invoice_id VARCHAR(100),
                description TEXT,
                bank_reference VARCHAR(100),
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completion_date TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_payment_method (payment_method)
            )
        `);

        // 30. Create WALLET BALANCES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wallet_balances (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) UNIQUE,
                user_email VARCHAR(255),
                balance DECIMAL(10,2) DEFAULT 0,
                total_deposited DECIMAL(10,2) DEFAULT 0,
                total_spent DECIMAL(10,2) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id)
            )
        `);

        // 31. Create PAYMENT TRANSACTIONS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transaction_id VARCHAR(50) UNIQUE,
                payment_id INT,
                user_id VARCHAR(50),
                type VARCHAR(50),
                amount DECIMAL(10,2),
                balance_before DECIMAL(10,2),
                balance_after DECIMAL(10,2),
                description TEXT,
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_type (type)
            )
        `);

        // 32. Create ADVERTISER CAMPAIGNS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS advertiser_campaigns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                campaign_id VARCHAR(50) UNIQUE,
                advertiser_name VARCHAR(255) NOT NULL,
                advertiser_email VARCHAR(255) NOT NULL,
                advertiser_phone VARCHAR(50),
                business_name VARCHAR(255),
                industry VARCHAR(100),
                ad_format VARCHAR(100) NOT NULL,
                budget DECIMAL(10,2) NOT NULL,
                duration_days INT NOT NULL,
                target_audience VARCHAR(255),
                message TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                impressions INT DEFAULT 0,
                clicks INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (advertiser_email),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        `);

        // 33. Create ADVERTISER ACCESS CODES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS advertiser_access_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                access_code VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_access_code (access_code),
                INDEX idx_email (email)
            )
        `);

        // 34. Create COURSE ANALYTICS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_analytics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                date DATE NOT NULL,
                views INT DEFAULT 0,
                clicks INT DEFAULT 0,
                enrollments INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES institution_hosted_courses(id) ON DELETE CASCADE,
                INDEX idx_course_id (course_id),
                INDEX idx_date (date)
            )
        `);

        console.log('✅ All tables created/verified');
        await insertSampleData();
        
    } catch (error) {
        console.error('Error creating tables:', error.message);
        // Don't throw - allow server to continue with in-memory fallback
    }
}

// ========== INSERT SAMPLE DATA ==========
async function insertSampleData() {
    try {
        // Check if media_news has data
        const [newsCount] = await pool.query('SELECT COUNT(*) as count FROM media_news');
        if (newsCount[0].count === 0) {
            console.log('📊 Inserting sample news data...');
            
            const newsData = [
                { title: 'Digital Marketing Trends 2024', category: 'Technology', date: '2024-03-15', alert: 'not-causing', description: 'Latest trends in digital marketing that will shape the industry this year.', source: 'TechCrunch', content_type: 'Marketing' },
                { title: 'E-commerce Boom in Africa', category: 'E-commerce', date: '2024-03-10', alert: 'causing', description: 'Rapid growth of e-commerce platforms across African markets causing major shifts.', source: 'Business Daily', content_type: 'Marketing' },
                { title: 'Healthcare Tech Revolution', category: 'Healthcare', date: '2024-03-05', alert: 'not-causing', description: 'New technologies transforming healthcare delivery and patient care.', source: 'Health Tech Magazine', content_type: 'Restructuring' },
                { title: 'Real Estate Market Update', category: 'Real Estate', date: '2024-02-28', alert: 'causing', description: 'Property prices surge causing alarm among potential homebuyers.', source: 'Property Weekly', content_type: 'Restructuring' },
                { title: 'EdTech Growth Statistics', category: 'Education', date: '2024-02-20', alert: 'not-causing', description: 'Educational technology sector shows remarkable growth.', source: 'EdSurge', content_type: 'Marketing' },
                { title: 'AI in Marketing', category: 'Technology', date: '2024-03-12', alert: 'causing', description: 'AI adoption causing disruption in traditional marketing roles.', source: 'Wired', content_type: 'Marketing' }
            ];

            for (const news of newsData) {
                await pool.query(
                    `INSERT INTO media_news (title, category, date, alert, description, source, content_type) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [news.title, news.category, news.date, news.alert, news.description, news.source, news.content_type]
                );
            }
            console.log('✅ Sample news data inserted:', newsData.length);
        }

        // Check if media_insights has data
        const [insightsCount] = await pool.query('SELECT COUNT(*) as count FROM media_insights');
        if (insightsCount[0].count === 0) {
            console.log('📊 Inserting sample insights data...');
            
            const insightsData = [
                { title: 'Future of Digital Commerce', category: 'E-commerce', type: 'Trend Analysis', description: 'In-depth analysis of where e-commerce is heading in the next 5 years.', author: 'Dr. Sarah Johnson', content_type: 'Marketing' },
                { title: 'Tech Industry Disruption', category: 'Technology', type: 'Market Research', description: 'How emerging technologies are reshaping the tech landscape.', author: 'Mark Thompson', content_type: 'Marketing' },
                { title: 'Healthcare Digital Transformation', category: 'Healthcare', type: 'Case Study', description: 'Case study of successful digital transformation in healthcare.', author: 'Dr. James Wilson', content_type: 'Restructuring' },
                { title: 'Real Estate Investment Strategies', category: 'Real Estate', type: 'Expert Opinion', description: 'Expert insights on real estate investment opportunities.', author: 'Lisa Martinez', content_type: 'Restructuring' },
                { title: 'Educational Technology Trends', category: 'Education', type: 'Trend Analysis', description: 'Latest trends and innovations in educational technology.', author: 'Prof. David Chen', content_type: 'Marketing' }
            ];

            for (const insight of insightsData) {
                await pool.query(
                    `INSERT INTO media_insights (title, category, type, description, author, content_type) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [insight.title, insight.category, insight.type, insight.description, insight.author, insight.content_type]
                );
            }
            console.log('✅ Sample insights data inserted:', insightsData.length);
        }

        // Check if expert services exist
        const [services] = await pool.query('SELECT COUNT(*) as count FROM expert_services');
        if (services[0].count === 0) {
            console.log('📊 Inserting sample expert services...');
            const expertServices = [
                { category: 'marketing', service_type: 'marketing_services', title: 'Search Engine Optimization (SEO)', description: 'Boost your online visibility with our proven SEO strategies that drive organic traffic and improve search rankings.', icon: 'fa-google' },
                { category: 'marketing', service_type: 'marketing_services', title: 'Social Media Management', description: 'Engage your audience across all major platforms with tailored content strategies and community management.', icon: 'fa-share-alt' },
                { category: 'marketing', service_type: 'marketing_services', title: 'Content Marketing', description: 'Create compelling content that tells your brand story and converts visitors into loyal customers.', icon: 'fa-edit' },
                { category: 'marketing', service_type: 'marketing_services', title: 'Email Marketing Campaigns', description: 'Reach your customers directly with personalized email campaigns that drive engagement and sales.', icon: 'fa-envelope' },
                { category: 'marketing', service_type: 'marketing_services', title: 'Pay-Per-Click Advertising (PPC)', description: 'Get immediate visibility with targeted PPC campaigns that maximize your ROI.', icon: 'fa-ad' },
                { category: 'marketing', service_type: 'marketing_strategies', title: 'Digital Transformation Strategy', description: 'Comprehensive digital strategy to transform your business operations and customer engagement.', icon: 'fa-rocket' },
                { category: 'marketing', service_type: 'marketing_strategies', title: 'Brand Identity Development', description: 'Build a powerful brand identity that resonates with your target audience and sets you apart.', icon: 'fa-paint-brush' },
                { category: 'marketing', service_type: 'marketing_strategies', title: 'Market Penetration Strategy', description: 'Strategic approach to expand your market share and reach new customer segments effectively.', icon: 'fa-bullseye' },
                { category: 'marketing', service_type: 'marketing_strategies', title: 'Customer Retention Programs', description: 'Develop loyalty programs and retention strategies to maximize customer lifetime value.', icon: 'fa-heart' },
                { category: 'restructuring', service_type: 'restructuring_services', title: 'Organizational Restructuring', description: 'Redesign your organizational structure for improved efficiency, agility, and growth.', icon: 'fa-sitemap' },
                { category: 'restructuring', service_type: 'restructuring_services', title: 'Business Process Reengineering', description: 'Transform your business processes to achieve dramatic improvements in productivity and quality.', icon: 'fa-cogs' },
                { category: 'restructuring', service_type: 'restructuring_services', title: 'Financial Restructuring', description: 'Optimize your financial structure for sustainable growth and improved profitability.', icon: 'fa-chart-line' },
                { category: 'restructuring', service_type: 'restructuring_services', title: 'Digital Workflow Optimization', description: 'Streamline your workflows with digital solutions that enhance efficiency and collaboration.', icon: 'fa-tasks' },
                { category: 'restructuring', service_type: 'restructuring_strategies', title: 'Change Management Strategy', description: 'Effectively manage organizational change with proven strategies that ensure smooth transitions.', icon: 'fa-exchange-alt' },
                { category: 'restructuring', service_type: 'restructuring_strategies', title: 'Lean Operations Implementation', description: 'Implement lean methodologies to eliminate waste and maximize value delivery.', icon: 'fa-microscope' },
                { category: 'restructuring', service_type: 'restructuring_strategies', title: 'Innovation Framework Design', description: 'Design an innovation framework that fosters creativity and drives continuous improvement.', icon: 'fa-lightbulb' },
                { category: 'restructuring', service_type: 'restructuring_strategies', title: 'Strategic Partnership Development', description: 'Identify and develop strategic partnerships that accelerate growth and create value.', icon: 'fa-handshake' }
            ];

            for (const service of expertServices) {
                await pool.query(
                    `INSERT INTO expert_services (category, service_type, title, description, icon) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [service.category, service.service_type, service.title, service.description, service.icon]
                );
            }
            console.log('✅ Sample expert services inserted');
        }

        // Check if ad packages exist
        const [packages] = await pool.query('SELECT COUNT(*) as count FROM ad_packages');
        if (packages[0].count === 0) {
            console.log('📊 Inserting sample ad packages...');
            const adPackages = [
                { package_name: 'Premium Homepage Banner', category: 'premium', price: 2500, impressions_estimate: 100000, description: 'Prime placement at the top of our homepage with maximum visibility.', duration_days: 30 },
                { package_name: 'Sidebar Banner', category: 'standard', price: 800, impressions_estimate: 35000, description: 'Strategic sidebar placement visible on every page of the website.', duration_days: 30 },
                { package_name: 'In-Content Native Ad', category: 'native', price: 1200, impressions_estimate: 50000, description: 'Seamlessly integrated ads that match content style for better engagement.', duration_days: 30 },
                { package_name: 'Newsletter Sponsorship', category: 'newsletter', price: 600, impressions_estimate: 20000, description: 'Reach our engaged subscriber base directly in their inbox.', duration_days: 30 },
                { package_name: 'Video Pre-roll Ad', category: 'premium', price: 3000, impressions_estimate: 80000, description: '15-second video ads before our premium video content.', duration_days: 30 },
                { package_name: 'Category Page Banner', category: 'standard', price: 500, impressions_estimate: 20000, description: 'Targeted ads on specific category pages for relevant audiences.', duration_days: 30 },
                { package_name: 'Sponsored Article', category: 'native', price: 1800, impressions_estimate: 60000, description: 'Full sponsored article written by our team about your brand.', duration_days: 30 },
                { package_name: 'Weekly Spotlight', category: 'newsletter', price: 400, impressions_estimate: 15000, description: 'Featured placement in our weekly newsletter reaching key audiences.', duration_days: 7 }
            ];

            for (const ad of adPackages) {
                await pool.query(
                    `INSERT INTO ad_packages (package_name, category, price, impressions_estimate, description, duration_days) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [ad.package_name, ad.category, ad.price, ad.impressions_estimate, ad.description, ad.duration_days]
                );
            }
            console.log('✅ Sample ad packages inserted');
        }

        // Check if branches exist
        const [branches] = await pool.query('SELECT COUNT(*) as count FROM branches');
        if (branches[0].count === 0) {
            console.log('📊 Inserting sample branches...');
            await pool.query(
                `INSERT INTO branches (name, address, latitude, longitude, phone, email, is_active) VALUES 
                 ('Nairobi Campus', 'Nairobi, Kenya', -1.2921, 36.8219, '+254 700 000 000', 'nairobi@lanvai.com', 1),
                 ('Online Campus', 'Remote Learning', 0, 0, '+254 700 000 001', 'online@lanvai.com', 1),
                 ('Innovation Hub Lagos', 'Lagos, Nigeria', 6.5244, 3.3792, '+234 800 000 000', 'lagos@lanvai.com', 1)`
            );
            console.log('✅ Sample branches inserted');
        }

        // ===== LIBRARY SAMPLE DATA =====
        const [categories] = await pool.query('SELECT COUNT(*) as count FROM book_categories');
        if (categories[0].count === 0) {
            console.log('📊 Inserting sample book categories...');
            const categoriesData = [
                'Novels', 'Short stories', 'Poems', 'Tongue twisters', 'Classic', 
                'Adventure', 'Fantasy', 'Science fiction', 'Detective', 'Children',
                'Historical', 'Philosophy', 'Drama', 'Essays', 'Biography',
                'Fairytales', 'Religion', 'Romance', 'Mystery', 'Professional literature'
            ];
            for (const name of categoriesData) {
                await pool.query(
                    'INSERT INTO book_categories (name, description) VALUES (?, ?)',
                    [name, `${name} collection`]
                );
            }
            console.log('✅ Sample book categories inserted');
        }

        const [books] = await pool.query('SELECT COUNT(*) as count FROM library_books');
        if (books[0].count === 0) {
            console.log('📊 Inserting sample books...');
            const booksData = [
                { title: 'The Alchemist', author: 'Paulo Coelho', category: 'Novels', genre: 'Adventure', price: 12.99, book_type: 'ebook', year_published: 1988 },
                { title: 'Dune', author: 'Frank Herbert', category: 'Science fiction', genre: 'Science fiction', price: 18.50, book_type: 'ebook', year_published: 1965 },
                { title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Classic', genre: 'Classic', price: 9.99, book_type: 'ebook', year_published: 1813 },
                { title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'Detective', genre: 'Mystery', price: 14.20, book_type: 'ebook', year_published: 1887 },
                { title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', category: 'Fantasy', genre: 'Fantasy', price: 22.00, book_type: 'ebook', year_published: 1997 },
                { title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Adventure', genre: 'Fantasy', price: 11.40, book_type: 'ebook', year_published: 1937 },
                { title: '1984', author: 'George Orwell', category: 'Science fiction', genre: 'Science fiction', price: 10.99, book_type: 'ebook', year_published: 1949 },
                { title: 'Little Women', author: 'Louisa May Alcott', category: 'Classic', genre: 'Classic', price: 8.75, book_type: 'ebook', year_published: 1868 }
            ];
            for (const book of booksData) {
                await pool.query(
                    `INSERT INTO library_books (title, author, category, genre, price, book_type, year_published) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [book.title, book.author, book.category, book.genre, book.price, book.book_type, book.year_published]
                );
            }
            console.log('✅ Sample books inserted');
        }

    } catch (error) {
        console.error('Error inserting sample data:', error.message);
    }
}

// ========== IN-MEMORY STORAGE (Fallback) ==========
const storage = {
    mediaSubmissions: [],
    expertSubmissions: [],
    adSelections: [],
    cookieConsents: {},
    userActions: [],
    institutionHostedSubmissions: [],
    lanvaiHostedSubmissions: [],
    bookSubmissions: [],
    pageViews: [],
    clicks: [],
    formSubmissions: [],
    inquiries: [],
    lanvaiInquiries: [],
    mediaNews: [],
    mediaInsights: [],
    payments: []
};

// ========== HELPER FUNCTIONS ==========

function getCookie(req, name) {
    const cookies = req.headers.cookie || '';
    const parts = cookies.split(';');
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.indexOf(name + '=') === 0) {
            return part.substring(name.length + 1);
        }
    }
    return null;
}

function setCookie(res, name, value, days) {
    days = days || 365;
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    res.setHeader('Set-Cookie', name + '=' + value + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax');
}

function generateVisitorId() {
    return 'visitor_' + Math.random().toString(36).substring(2, 18);
}

function getVisitorId(req, res) {
    let visitorId = getCookie(req, 'visitor_id');
    if (!visitorId) {
        visitorId = generateVisitorId();
        setCookie(res, 'visitor_id', visitorId);
    }
    return visitorId;
}

function sendJSON(res, statusCode, data) {
    res.statusCode = statusCode || 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.end(JSON.stringify(data));
}

function sendOptions(res) {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.end();
}

function getDefaultCourses() {
    return [
        { id: 1, name: "Data Science & Analytics", institution: "Lanvai Tech Academy", category: "Data Science", mode: "Online", studyType: "Full-time", price: 4500, branch: "Nairobi Campus", address: "Nairobi, Kenya", lat: -1.2921, lng: 36.8219, intakeDate: "2025-05", clusterPoints: 32, duration: 2, hostedType: "institution" },
        { id: 2, name: "Full Stack Web Development", institution: "CodeCraft Academy", category: "Programming", mode: "Hybrid", studyType: "Full-time", price: 3800, branch: "Online", address: "Remote", lat: 0, lng: 0, intakeDate: "2025-01", clusterPoints: 28, duration: 1.5, hostedType: "institution" },
        { id: 3, name: "Digital Marketing Mastery", institution: "Nairobi Digital Institute", category: "Marketing", mode: "Offline", studyType: "Part-time", price: 2800, branch: "Nairobi Campus", address: "Nairobi, Kenya", lat: -1.2833, lng: 36.8167, intakeDate: "2025-09", clusterPoints: 24, duration: 1, hostedType: "institution" },
        { id: 4, name: "UI/UX Design Pro", institution: "Innovation Hub Lagos", category: "Design", mode: "Online", studyType: "Full-time", price: 3200, branch: "Online", address: "Remote", lat: 0, lng: 0, intakeDate: "2026-01", clusterPoints: 30, duration: 1.5, hostedType: "institution" },
        { id: 5, name: "Business Administration", institution: "Crestview University", category: "Business", mode: "Hybrid", studyType: "Full-time", price: 5200, branch: "Nairobi Campus", address: "Nairobi, Kenya", lat: -1.2763, lng: 36.8210, intakeDate: "2025-05", clusterPoints: 35, duration: 4, hostedType: "institution" },
        { id: 6, name: "Cloud Computing & DevOps", institution: "EDULINK Academy", category: "Technology", mode: "Online", studyType: "Full-time", price: 4900, branch: "Online", address: "Remote", lat: 0, lng: 0, intakeDate: "2025-09", clusterPoints: 34, duration: 1.5, hostedType: "lanvai" },
        { id: 7, name: "AI & Machine Learning", institution: "EDULINK Academy", category: "Data Science", mode: "Online", studyType: "Full-time", price: 5500, branch: "Online", address: "Remote", lat: 0, lng: 0, intakeDate: "2026-01", clusterPoints: 40, duration: 2, hostedType: "lanvai" }
    ];
}

function getDefaultBooks() {
    return [
        { id: 1, title: "The Alchemist", author: "Paulo Coelho", category: "Novels", genre: "Adventure", price: 12.99, book_type: "ebook", year_published: 1988 },
        { id: 2, title: "Dune", author: "Frank Herbert", category: "Science fiction", genre: "Science fiction", price: 18.50, book_type: "ebook", year_published: 1965 },
        { id: 3, title: "Pride and Prejudice", author: "Jane Austen", category: "Classic", genre: "Classic", price: 9.99, book_type: "ebook", year_published: 1813 },
        { id: 4, title: "Sherlock Holmes", author: "Arthur Conan Doyle", category: "Detective", genre: "Mystery", price: 14.20, book_type: "ebook", year_published: 1887 },
        { id: 5, title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", category: "Fantasy", genre: "Fantasy", price: 22.00, book_type: "ebook", year_published: 1997 },
        { id: 6, title: "The Hobbit", author: "J.R.R. Tolkien", category: "Adventure", genre: "Fantasy", price: 11.40, book_type: "ebook", year_published: 1937 },
        { id: 7, title: "1984", author: "George Orwell", category: "Science fiction", genre: "Science fiction", price: 10.99, book_type: "ebook", year_published: 1949 },
        { id: 8, title: "Little Women", author: "Louisa May Alcott", category: "Classic", genre: "Classic", price: 8.75, book_type: "ebook", year_published: 1868 }
    ];
}

// ==============================================
// ===== PAYMENT FUNCTIONS =====
// ==============================================

function generatePaymentId() {
    return 'PAY' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateTransactionId() {
    return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ==============================================
// ===== INTASEND PAYMENT HANDLERS =====
// ==============================================


// ===== INTASEND M-PESA STK PUSH =====
async function handleIntasendStkPush(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[IntaSend STK Push] Received:', data);
            
            // Validate required fields
            if (!data.phone || !data.amount) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Phone number and amount are required' 
                });
                return;
            }
            
            // Validate phone number
            const phoneRegex = /^(07|01|\+254|254)[0-9]{8,9}$/;
            if (!phoneRegex.test(data.phone)) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Please enter a valid Kenyan phone number (e.g., 0712345678)' 
                });
                return;
            }
            
            // Get and validate amount - FIX: Define amount variable here
            const amount = parseFloat(data.amount);
            if (isNaN(amount) || amount < 1) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Minimum amount is 1 KES' 
                });
                return;
            }
            
            // Maximum amount check
            if (amount > 1000000) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Maximum amount is 1,000,000 KES' 
                });
                return;
            }
            
            // Format phone number
            let formattedPhone = data.phone;
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '254' + formattedPhone.substring(1);
            } else if (formattedPhone.startsWith('+254')) {
                formattedPhone = formattedPhone.substring(1);
            } else if (!formattedPhone.startsWith('254')) {
                formattedPhone = '254' + formattedPhone;
            }
            formattedPhone = formattedPhone.replace(/\D/g, '');
            
            // Generate IDs
            const visitorId = getVisitorId(req, res);
            const paymentId = generatePaymentId();
            
            // Get base URL from request or environment
            const baseUrl = data.base_url || process.env.BASE_URL || 'http://localhost:5000';
            
            // Build checkout data
            const checkoutData = {
                amount: amount,
                currency: 'KES',
                email: data.email || 'customer@example.com',
                phone_number: formattedPhone,
                description: data.description || 'Course enrollment via EDULINK',
                api_ref: paymentId,
                redirect_url: `${baseUrl}/payment-success.html`,
                webhook_url: `${baseUrl}/api/payment/intasend-webhook`,
                method: 'MPESA_STK_PUSH',
                wallet_id: INTASEND_CONFIG.walletId || undefined
            };
            
            console.log('[IntaSend] Checkout Data:', JSON.stringify(checkoutData, null, 2));
            
            try {
                // Try to call IntaSend API
                const response = await intasendRequest('/checkout/', 'POST', checkoutData);
                console.log('[IntaSend] Response:', JSON.stringify(response, null, 2));
                
                // Check if response indicates simulation
                if (response && response.simulation) {
                    // Save payment to database with simulation status
                    if (dbConnected && pool) {
                        await pool.query(
                            `INSERT INTO payments 
                             (payment_id, user_id, user_phone, amount, currency, payment_method, 
                              payment_type, status, description, reference) 
                             VALUES (?, ?, ?, ?, 'KES', 'mpesa', 'deposit', 'pending', ?, ?)`,
                            [
                                paymentId,
                                visitorId,
                                formattedPhone,
                                amount,
                                data.description || 'M-Pesa STK Push deposit (simulation)',
                                'SIM_' + Date.now()
                            ]
                        );
                    }
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: '✅ Payment initiated! (Simulation mode - no actual charge)',
                        payment_id: paymentId,
                        amount: amount,
                        currency: 'KES',
                        phone: formattedPhone,
                        status: 'pending',
                        is_simulation: true
                    });
                    
                    // Auto-complete simulation after 3 seconds
                    setTimeout(() => {
                        simulateIntasendCallback(paymentId, amount, visitorId);
                    }, 3000);
                    
                    return;
                }
                
                // Check if response indicates success
                if (response && response.status === 'success') {
                    const intasendPaymentId = response.id || response.payment_id;
                    const intasendInvoiceId = response.invoice_id;
                    const checkoutUrl = response.url || response.checkout_url;
                    
                    if (dbConnected && pool) {
                        await pool.query(
                            `INSERT INTO payments 
                             (payment_id, user_id, user_phone, amount, currency, payment_method, 
                              payment_type, status, intasend_payment_id, intasend_invoice_id, 
                              description, reference) 
                             VALUES (?, ?, ?, ?, 'KES', 'mpesa', 'deposit', 'pending', ?, ?, ?, ?)`,
                            [
                                paymentId,
                                visitorId,
                                formattedPhone,
                                amount,
                                intasendPaymentId || '',
                                intasendInvoiceId || '',
                                data.description || 'M-Pesa STK Push deposit',
                                intasendPaymentId || paymentId
                            ]
                        );
                    }
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'STK Push sent to your phone! Please check M-Pesa and enter PIN.',
                        payment_id: paymentId,
                        amount: amount,
                        currency: 'KES',
                        phone: formattedPhone,
                        status: 'pending',
                        intasend_payment_id: intasendPaymentId,
                        intasend_invoice_id: intasendInvoiceId,
                        checkout_url: checkoutUrl
                    });
                } else {
                    // If API returns unexpected response, use simulation
                    console.warn('[IntaSend] Unexpected response, using simulation');
                    
                    if (dbConnected && pool) {
                        await pool.query(
                            `INSERT INTO payments 
                             (payment_id, user_id, user_phone, amount, currency, payment_method, 
                              payment_type, status, description, reference) 
                             VALUES (?, ?, ?, ?, 'KES', 'mpesa', 'deposit', 'pending', ?, ?)`,
                            [
                                paymentId,
                                visitorId,
                                formattedPhone,
                                amount,
                                data.description || 'M-Pesa STK Push deposit (fallback)',
                                'FALLBACK_' + Date.now()
                            ]
                        );
                    }
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: '✅ Payment processed! (Fallback mode)',
                        payment_id: paymentId,
                        amount: amount,
                        currency: 'KES',
                        phone: formattedPhone,
                        status: 'pending',
                        is_simulation: true
                    });
                    
                    setTimeout(() => {
                        simulateIntasendCallback(paymentId, amount, visitorId);
                    }, 3000);
                }
                
            } catch (error) {
                console.error('[IntaSend] Error:', error.message);
                
                // Use simulation as final fallback
                if (dbConnected && pool) {
                    await pool.query(
                        `INSERT INTO payments 
                         (payment_id, user_id, user_phone, amount, currency, payment_method, 
                          payment_type, status, description, reference) 
                         VALUES (?, ?, ?, ?, 'KES', 'mpesa', 'deposit', 'pending', ?, ?)`,
                        [
                            paymentId,
                            visitorId,
                            formattedPhone,
                            amount,
                            data.description || 'M-Pesa STK Push deposit (error fallback)',
                            'ERROR_' + Date.now()
                        ]
                    );
                }
                
                sendJSON(res, 200, {
                    success: true,
                    message: '✅ Payment processed! (Simulation mode - API unavailable)',
                    payment_id: paymentId,
                    amount: amount,
                    currency: 'KES',
                    phone: formattedPhone,
                    status: 'pending',
                    is_simulation: true
                });
                
                setTimeout(() => {
                    simulateIntasendCallback(paymentId, amount, visitorId);
                }, 3000);
            }
            
        } catch (e) {
            console.error('[IntaSend STK Push Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ===== INTASEND WEBHOOK (Callback) =====
async function handleIntasendWebhook(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[IntaSend Webhook] Received:', JSON.stringify(data, null, 2));
            
            // Verify webhook signature (optional but recommended)
            // You should verify the signature using your secret key
            
            const event = data.event || data.type;
            const paymentData = data.data || data;
            
            if (event === 'payment.success' || event === 'checkout.success') {
                const intasendPaymentId = paymentData.id || paymentData.payment_id;
                const amount = parseFloat(paymentData.amount) || 0;
                const intasendInvoiceId = paymentData.invoice_id;
                const status = paymentData.status || 'completed';
                const userPhone = paymentData.phone_number || paymentData.phone;
                
                if (dbConnected && pool) {
                    // Find the payment by intasend_payment_id
                    const [paymentRows] = await pool.query(
                        'SELECT * FROM payments WHERE intasend_payment_id = ? OR intasend_invoice_id = ?',
                        [intasendPaymentId, intasendInvoiceId]
                    );
                    
                    if (paymentRows && paymentRows.length > 0) {
                        const payment = paymentRows[0];
                        const visitorId = payment.user_id;
                        const paymentAmount = parseFloat(payment.amount);
                        
                        // Update payment status
                        await pool.query(
                            `UPDATE payments 
                             SET status = 'completed', completion_date = NOW() 
                             WHERE id = ?`,
                            [payment.id]
                        );
                        
                        // Update wallet balance
                        const [walletCheck] = await pool.query(
                            'SELECT * FROM wallet_balances WHERE user_id = ?',
                            [visitorId]
                        );
                        
                        if (walletCheck && walletCheck.length > 0) {
                            const newBalance = parseFloat(walletCheck[0].balance) + paymentAmount;
                            const newTotalDeposited = parseFloat(walletCheck[0].total_deposited) + paymentAmount;
                            await pool.query(
                                `UPDATE wallet_balances 
                                 SET balance = ?, total_deposited = ? 
                                 WHERE user_id = ?`,
                                [newBalance, newTotalDeposited, visitorId]
                            );
                        } else {
                            await pool.query(
                                `INSERT INTO wallet_balances (user_id, balance, total_deposited) 
                                 VALUES (?, ?, ?)`,
                                [visitorId, paymentAmount, paymentAmount]
                            );
                        }
                        
                        // Create transaction record
                        const transactionId = generateTransactionId();
                        await pool.query(
                            `INSERT INTO payment_transactions 
                             (transaction_id, payment_id, user_id, type, amount, 
                              balance_before, balance_after, description, status) 
                             VALUES (?, ?, ?, 'deposit', ?, ?, ?, ?, 'completed')`,
                            [
                                transactionId,
                                payment.id,
                                visitorId,
                                paymentAmount,
                                walletCheck && walletCheck.length > 0 ? parseFloat(walletCheck[0].balance) : 0,
                                walletCheck && walletCheck.length > 0 ? parseFloat(walletCheck[0].balance) + paymentAmount : paymentAmount,
                                `M-Pesa deposit of KES ${paymentAmount.toFixed(2)} via IntaSend`
                            ]
                        );
                        
                        console.log('[IntaSend Webhook] ✅ Payment completed! Payment ID:', payment.payment_id);
                    } else {
                        console.log('[IntaSend Webhook] ⚠️ Payment not found in database');
                    }
                }
            } else if (event === 'payment.failed' || event === 'checkout.failed') {
                const intasendPaymentId = paymentData.id || paymentData.payment_id;
                const intasendInvoiceId = paymentData.invoice_id;
                
                if (dbConnected && pool) {
                    await pool.query(
                        `UPDATE payments 
                         SET status = 'failed' 
                         WHERE intasend_payment_id = ? OR intasend_invoice_id = ?`,
                        [intasendPaymentId, intasendInvoiceId]
                    );
                }
                console.log('[IntaSend Webhook] ❌ Payment failed:', intasendPaymentId);
            }
            
            sendJSON(res, 200, { success: true });
            
        } catch (e) {
            console.error('[IntaSend Webhook Error]', e);
            sendJSON(res, 200, { success: true });
        }
    });
}

// ===== SIMULATE INTASEND CALLBACK (For Testing) =====
async function simulateIntasendCallback(paymentId, amount, visitorId) {
    console.log('[IntaSend] Simulating callback for:', paymentId);
    
    try {
        if (dbConnected && pool) {
            const [paymentRows] = await pool.query(
                'SELECT * FROM payments WHERE payment_id = ?',
                [paymentId]
            );
            
            if (paymentRows && paymentRows.length > 0) {
                const payment = paymentRows[0];
                
                await pool.query(
                    `UPDATE payments 
                     SET status = 'completed', completion_date = NOW() 
                     WHERE payment_id = ?`,
                    [paymentId]
                );
                
                const [walletCheck] = await pool.query(
                    'SELECT * FROM wallet_balances WHERE user_id = ?',
                    [visitorId]
                );
                
                if (walletCheck && walletCheck.length > 0) {
                    const newBalance = parseFloat(walletCheck[0].balance) + amount;
                    const newTotalDeposited = parseFloat(walletCheck[0].total_deposited) + amount;
                    await pool.query(
                        `UPDATE wallet_balances 
                         SET balance = ?, total_deposited = ? 
                         WHERE user_id = ?`,
                        [newBalance, newTotalDeposited, visitorId]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO wallet_balances (user_id, balance, total_deposited) 
                         VALUES (?, ?, ?)`,
                        [visitorId, amount, amount]
                    );
                }
                
                const transactionId = generateTransactionId();
                await pool.query(
                    `INSERT INTO payment_transactions 
                     (transaction_id, payment_id, user_id, type, amount, 
                      balance_before, balance_after, description, status) 
                     VALUES (?, ?, ?, 'deposit', ?, ?, ?, ?, 'completed')`,
                    [
                        transactionId,
                        payment.id,
                        visitorId,
                        amount,
                        walletCheck && walletCheck.length > 0 ? parseFloat(walletCheck[0].balance) : 0,
                        walletCheck && walletCheck.length > 0 ? parseFloat(walletCheck[0].balance) + amount : amount,
                        `M-Pesa deposit of KES ${amount.toFixed(2)} (Simulated)`
                    ]
                );
                
                console.log('[IntaSend] ✅ Payment completed! Payment ID:', paymentId);
            }
        }
    } catch (error) {
        console.error('[IntaSend] Simulate callback error:', error);
    }
}

// ===== INTASEND PAYMENT STATUS CHECK =====
async function handleIntasendStatus(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const paymentId = params.paymentId;
        
        if (!paymentId) {
            sendJSON(res, 400, { 
                success: false, 
                error: 'Payment ID is required' 
            });
            return;
        }
        
        if (dbConnected && pool) {
            const [paymentRows] = await pool.query(
                'SELECT * FROM payments WHERE payment_id = ?',
                [paymentId]
            );
            
            if (paymentRows && paymentRows.length > 0) {
                const payment = paymentRows[0];
                sendJSON(res, 200, {
                    success: true,
                    status: payment.status,
                    amount: payment.amount,
                    currency: payment.currency,
                    payment_id: payment.payment_id,
                    payment_method: payment.payment_method
                });
            } else {
                sendJSON(res, 404, {
                    success: false,
                    error: 'Payment not found'
                });
            }
        } else {
            sendJSON(res, 200, {
                success: true,
                status: 'pending',
                message: 'Payment is being processed'
            });
        }
    } catch (error) {
        console.error('[IntaSend Status Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message 
        });
    }
}

// ===== INTASEND CARD PAYMENT =====
async function handleIntasendCardPayment(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[IntaSend Card Payment] Received');
            
            if (!data.cardNumber || !data.expiryMonth || !data.expiryYear || !data.cvv || !data.amount) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Card number, expiry date, CVV, and amount are required' 
                });
                return;
            }
            
            const amount = parseFloat(data.amount);
            if (isNaN(amount) || amount < 100) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Minimum amount for card payment is 100 KES' 
                });
                return;
            }
            
            const visitorId = getVisitorId(req, res);
            const paymentId = generatePaymentId();
            
            // Simple card validation
            const cardNumber = data.cardNumber.replace(/\s/g, '');
            if (cardNumber.length < 15 || cardNumber.length > 16) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Please enter a valid card number' 
                });
                return;
            }
            
            if (data.cvv.length < 3 || data.cvv.length > 4) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Please enter a valid CVV' 
                });
                return;
            }
            
            if (!INTASEND_CONFIG.secretKey) {
                // Simulation mode
                const isSuccessful = Math.random() < 0.95;
                
                if (dbConnected && pool) {
                    await pool.query(
                        `INSERT INTO payments 
                         (payment_id, user_id, user_email, amount, currency, payment_method, 
                          payment_type, status, reference, description) 
                         VALUES (?, ?, ?, ?, 'KES', 'card', 'deposit', ?, ?, ?)`,
                        [
                            paymentId,
                            visitorId,
                            data.email || '',
                            amount,
                            isSuccessful ? 'completed' : 'failed',
                            'CARD_SIM_' + Date.now(),
                            data.description || 'Card payment deposit'
                        ]
                    );
                    
                    if (isSuccessful) {
                        const [walletCheck] = await pool.query(
                            'SELECT * FROM wallet_balances WHERE user_id = ?',
                            [visitorId]
                        );
                        
                        if (walletCheck && walletCheck.length > 0) {
                            const newBalance = parseFloat(walletCheck[0].balance) + amount;
                            const newTotalDeposited = parseFloat(walletCheck[0].total_deposited) + amount;
                            await pool.query(
                                `UPDATE wallet_balances 
                                 SET balance = ?, total_deposited = ? 
                                 WHERE user_id = ?`,
                                [newBalance, newTotalDeposited, visitorId]
                            );
                        } else {
                            await pool.query(
                                `INSERT INTO wallet_balances (user_id, balance, total_deposited) 
                                 VALUES (?, ?, ?)`,
                                [visitorId, amount, amount]
                            );
                        }
                    }
                }
                
                if (isSuccessful) {
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Card payment successful!',
                        payment_id: paymentId,
                        amount: amount,
                        currency: 'KES',
                        status: 'completed',
                        card_last4: data.cardNumber.slice(-4),
                        card_brand: detectCardBrand(data.cardNumber),
                        is_simulation: true
                    });
                } else {
                    sendJSON(res, 400, {
                        success: false,
                        error: 'Card payment declined. Please try again.',
                        payment_id: paymentId,
                        amount: amount,
                        currency: 'KES',
                        status: 'failed'
                    });
                }
                return;
            }
            
            // Real card payment via IntaSend
            try {
                const checkoutData = {
                    amount: amount,
                    currency: 'KES',
                    email: data.email || 'customer@example.com',
                    description: data.description || 'Card Payment via Lanvai ADExchange',
                    api_ref: paymentId,
                    redirect_url: data.redirect_url || 'https://your-site.com/payment-success',
                    webhook_url: data.webhook_url || 'https://your-site.com/api/payment/intasend-webhook',
                    method: 'CARD',
                    wallet_id: INTASEND_CONFIG.walletId || undefined,
                    card: {
                        number: data.cardNumber.replace(/\s/g, ''),
                        expiry_month: data.expiryMonth,
                        expiry_year: data.expiryYear,
                        cvv: data.cvv,
                        name: data.cardName || 'Card Holder'
                    }
                };
                
                const response = await intasendRequest('/checkout/', 'POST', checkoutData);
                
                if (response && response.status === 'success') {
                    const intasendPaymentId = response.id || response.payment_id;
                    const intasendInvoiceId = response.invoice_id;
                    
                    if (dbConnected && pool) {
                        await pool.query(
                            `INSERT INTO payments 
                             (payment_id, user_id, user_email, amount, currency, payment_method, 
                              payment_type, status, intasend_payment_id, intasend_invoice_id, 
                              description, reference) 
                             VALUES (?, ?, ?, ?, 'KES', 'card', 'deposit', 'completed', ?, ?, ?, ?)`,
                            [
                                paymentId,
                                visitorId,
                                data.email || '',
                                amount,
                                intasendPaymentId,
                                intasendInvoiceId,
                                data.description || 'Card payment deposit',
                                intasendPaymentId
                            ]
                        );
                    }
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Card payment successful!',
                        payment_id: paymentId,
                        amount: amount,
                        currency: 'KES',
                        status: 'completed',
                        card_last4: data.cardNumber.slice(-4),
                        card_brand: detectCardBrand(data.cardNumber),
                        intasend_payment_id: intasendPaymentId
                    });
                } else {
                    throw new Error(response.message || 'Failed to process card payment');
                }
                
            } catch (error) {
                console.error('[IntaSend Card] Error:', error);
                sendJSON(res, 500, {
                    success: false,
                    error: 'Failed to process card payment: ' + (error.message || 'Unknown error')
                });
            }
            
        } catch (e) {
            console.error('[IntaSend Card Payment Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

function detectCardBrand(cardNumber) {
    cardNumber = cardNumber.replace(/[\s-]/g, '');
    
    if (cardNumber.match(/^4[0-9]{12}(?:[0-9]{3})?$/)) {
        return 'Visa';
    }
    if (cardNumber.match(/^5[1-5][0-9]{14}$/)) {
        return 'Mastercard';
    }
    if (cardNumber.match(/^3[47][0-9]{13}$/)) {
        return 'American Express';
    }
    if (cardNumber.match(/^6(?:011|5[0-9]{2})[0-9]{12}$/)) {
        return 'Discover';
    }
    if (cardNumber.match(/^62[0-9]{14,17}$/)) {
        return 'UnionPay';
    }
    return 'Unknown';
}

// ==============================================
// ===== BANK PAYMENT HANDLER =====
// ==============================================

async function handleBankPayment(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Bank Payment] Received:', data);
            
            if (!data.bank_name || !data.account_number || !data.amount) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Bank name, account number, and amount are required' 
                });
                return;
            }
            
            const amount = parseFloat(data.amount);
            if (isNaN(amount) || amount < 100) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Minimum amount for bank transfer is 100 KES' 
                });
                return;
            }
            
            const paymentId = generatePaymentId();
            const bankReference = 'BNK' + Date.now().toString().slice(-8);
            const visitorId = getVisitorId(req, res);
            
            if (dbConnected && pool) {
                try {
                    await pool.query(
                        `INSERT INTO payments 
                         (payment_id, user_id, user_email, user_phone, amount, currency, 
                          payment_method, payment_type, status, bank_reference, description) 
                         VALUES (?, ?, ?, ?, ?, 'KES', 'bank', 'deposit', 'pending', ?, ?)`,
                        [
                            paymentId,
                            visitorId,
                            data.email || '',
                            data.phone || '',
                            amount,
                            bankReference,
                            data.description || `Bank transfer from ${data.bank_name}`
                        ]
                    );
                    
                    console.log('[Bank Payment] ✅ Recorded! Payment ID:', paymentId);
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Bank transfer recorded successfully! Please wait for confirmation.',
                        payment_id: paymentId,
                        bank_reference: bankReference,
                        amount: amount,
                        currency: 'KES',
                        status: 'pending',
                        bank_details: {
                            bank_name: 'Lanvai Marketing Limited',
                            account_name: 'Lanvai Marketing Ltd',
                            account_number: '1234567890',
                            bank: 'Kenya Commercial Bank (KCB)',
                            branch: 'Nairobi CBD',
                            swift_code: 'KCBLKENX'
                        }
                    });
                    
                } catch (err) {
                    console.error('[Bank Payment DB Error]', err);
                    sendJSON(res, 500, { 
                        success: false, 
                        error: 'Database error: ' + err.message 
                    });
                }
            } else {
                storage.payments.push({
                    payment_id: paymentId,
                    user_id: visitorId,
                    bank_name: data.bank_name,
                    account_number: data.account_number,
                    amount: amount,
                    bank_reference: bankReference,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                });
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Bank transfer recorded (fallback)',
                    payment_id: paymentId,
                    bank_reference: bankReference,
                    amount: amount,
                    currency: 'KES',
                    status: 'pending'
                });
            }
            
        } catch (e) {
            console.error('[Bank Payment Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ==============================================
// ===== GET WALLET BALANCE =====
// ==============================================

async function handleGetWalletBalance(req, res) {
    console.log('[Wallet] Fetching balance...');
    
    try {
        const visitorId = getVisitorId(req, res);
        
        if (dbConnected && pool) {
            const [wallet] = await pool.query(
                'SELECT * FROM wallet_balances WHERE user_id = ?',
                [visitorId]
            );
            
            const [transactions] = await pool.query(
                `SELECT * FROM payment_transactions 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 20`,
                [visitorId]
            );
            
            const [payments] = await pool.query(
                `SELECT * FROM payments 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 20`,
                [visitorId]
            );
            
            if (wallet && wallet.length > 0) {
                sendJSON(res, 200, {
                    success: true,
                    balance: parseFloat(wallet[0].balance),
                    total_deposited: parseFloat(wallet[0].total_deposited),
                    total_spent: parseFloat(wallet[0].total_spent),
                    transactions: transactions || [],
                    payments: payments || [],
                    currency: 'KES'
                });
            } else {
                sendJSON(res, 200, {
                    success: true,
                    balance: 0,
                    total_deposited: 0,
                    total_spent: 0,
                    transactions: [],
                    payments: [],
                    currency: 'KES'
                });
            }
        } else {
            sendJSON(res, 200, {
                success: true,
                balance: 0,
                total_deposited: 0,
                total_spent: 0,
                transactions: [],
                payments: [],
                currency: 'KES',
                fallback: true
            });
        }
    } catch (error) {
        console.error('[Wallet Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message 
        });
    }
}

// ==============================================
// ===== CONFIRM BANK PAYMENT (Admin) =====
// ==============================================

async function handleConfirmBankPayment(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Confirm Bank Payment] Received:', data);
            
            if (!data.payment_id) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Payment ID is required' 
                });
                return;
            }
            
            if (dbConnected && pool) {
                const [paymentRows] = await pool.query(
                    'SELECT * FROM payments WHERE payment_id = ?',
                    [data.payment_id]
                );
                
                if (!paymentRows || paymentRows.length === 0) {
                    sendJSON(res, 404, { 
                        success: false, 
                        error: 'Payment not found' 
                    });
                    return;
                }
                
                const payment = paymentRows[0];
                
                if (payment.status !== 'pending') {
                    sendJSON(res, 400, { 
                        success: false, 
                        error: 'Payment is already ' + payment.status 
                    });
                    return;
                }
                
                await pool.query(
                    `UPDATE payments 
                     SET status = 'completed', completion_date = NOW() 
                     WHERE payment_id = ?`,
                    [data.payment_id]
                );
                
                const [walletCheck] = await pool.query(
                    'SELECT * FROM wallet_balances WHERE user_id = ?',
                    [payment.user_id]
                );
                
                const amount = parseFloat(payment.amount);
                
                if (walletCheck && walletCheck.length > 0) {
                    const newBalance = parseFloat(walletCheck[0].balance) + amount;
                    const newTotalDeposited = parseFloat(walletCheck[0].total_deposited) + amount;
                    await pool.query(
                        `UPDATE wallet_balances 
                         SET balance = ?, total_deposited = ? 
                         WHERE user_id = ?`,
                        [newBalance, newTotalDeposited, payment.user_id]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO wallet_balances (user_id, balance, total_deposited) 
                         VALUES (?, ?, ?)`,
                        [payment.user_id, amount, amount]
                    );
                }
                
                const transactionId = generateTransactionId();
                await pool.query(
                    `INSERT INTO payment_transactions 
                     (transaction_id, payment_id, user_id, type, amount, 
                      balance_before, balance_after, description, status) 
                     VALUES (?, ?, ?, 'deposit', ?, ?, ?, ?, 'completed')`,
                    [
                        transactionId,
                        payment.id,
                        payment.user_id,
                        amount,
                        walletCheck && walletCheck.length > 0 ? parseFloat(walletCheck[0].balance) : 0,
                        walletCheck && walletCheck.length > 0 ? parseFloat(walletCheck[0].balance) + amount : amount,
                        `Bank deposit confirmed - Reference: ${payment.bank_reference}`
                    ]
                );
                
                console.log('[Confirm Bank Payment] ✅ Confirmed! Payment ID:', data.payment_id);
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Bank payment confirmed successfully!',
                    payment_id: data.payment_id,
                    amount: amount,
                    currency: 'KES'
                });
            } else {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
            }
        } catch (e) {
            console.error('[Confirm Bank Payment Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid request: ' + e.message 
            });
        }
    });
}

// ==============================================
// ===== GET PAYMENT HISTORY =====
// ==============================================

async function handleGetPaymentHistory(req, res) {
    console.log('[Payment History] Fetching...');
    
    try {
        const visitorId = getVisitorId(req, res);
        
        if (dbConnected && pool) {
            const [payments] = await pool.query(
                `SELECT * FROM payments 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 50`,
                [visitorId]
            );
            
            sendJSON(res, 200, {
                success: true,
                payments: payments || [],
                count: payments ? payments.length : 0
            });
        } else {
            sendJSON(res, 200, {
                success: true,
                payments: [],
                count: 0,
                fallback: true
            });
        }
    } catch (error) {
        console.error('[Payment History Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message 
        });
    }
}

// ==============================================
// ===== GET ALL PAYMENTS (Admin) =====
// ==============================================

async function handleGetAllPayments(req, res) {
    console.log('[Admin Payments] Fetching all payments...');
    
    try {
        if (dbConnected && pool) {
            const [payments] = await pool.query(
                `SELECT * FROM payments 
                 ORDER BY created_at DESC 
                 LIMIT 100`
            );
            
            const [stats] = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount
                 FROM payments`
            );
            
            sendJSON(res, 200, {
                success: true,
                payments: payments || [],
                stats: stats[0] || { total: 0, completed: 0, pending: 0, failed: 0, total_amount: 0 },
                count: payments ? payments.length : 0
            });
        } else {
            sendJSON(res, 200, {
                success: true,
                payments: [],
                stats: { total: 0, completed: 0, pending: 0, failed: 0, total_amount: 0 },
                count: 0,
                fallback: true
            });
        }
    } catch (error) {
        console.error('[Admin Payments Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message 
        });
    }
}

// ==============================================
// ===== MEDIA HANDLERS =====
// ==============================================

// ===== GET: All News (with content_type filter) =====
async function handleGetNews(req, res) {
    console.log('[Media] Fetching news...');
    
    try {
        if (dbConnected && pool) {
            const urlParts = req.url.split('?');
            const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
            
            let sql = 'SELECT * FROM media_news WHERE is_active = TRUE';
            let queryParams = [];
            let conditions = [];
            
            if (params.category && params.category !== 'all') {
                conditions.push('category = ?');
                queryParams.push(params.category);
            }
            if (params.alert && params.alert !== 'all') {
                conditions.push('alert = ?');
                queryParams.push(params.alert);
            }
            if (params.date) {
                conditions.push('date = ?');
                queryParams.push(params.date);
            }
            if (params.content_type && params.content_type !== 'all') {
                conditions.push('content_type = ?');
                queryParams.push(params.content_type);
            }
            
            if (conditions.length > 0) {
                sql += ' AND ' + conditions.join(' AND ');
            }
            
            sql += ' ORDER BY date DESC, id DESC';
            
            const [rows] = await pool.query(sql, queryParams);
            console.log('[Media] Found', rows.length, 'news articles');
            
            sendJSON(res, 200, { 
                success: true,
                news: rows,
                count: rows.length
            });
        } else {
            const defaultNews = getDefaultNews();
            sendJSON(res, 200, { 
                success: true,
                news: storage.mediaNews.length > 0 ? storage.mediaNews : defaultNews,
                count: storage.mediaNews.length > 0 ? storage.mediaNews.length : defaultNews.length
            });
        }
    } catch (error) {
        console.error('[Media News Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ===== GET: All Insights (with content_type filter) =====
async function handleGetInsights(req, res) {
    console.log('[Media] Fetching insights...');
    
    try {
        if (dbConnected && pool) {
            const urlParts = req.url.split('?');
            const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
            
            let sql = 'SELECT * FROM media_insights WHERE is_active = TRUE';
            let queryParams = [];
            let conditions = [];
            
            if (params.category && params.category !== 'all') {
                conditions.push('category = ?');
                queryParams.push(params.category);
            }
            if (params.type && params.type !== 'all') {
                conditions.push('type = ?');
                queryParams.push(params.type);
            }
            if (params.content_type && params.content_type !== 'all') {
                conditions.push('content_type = ?');
                queryParams.push(params.content_type);
            }
            
            if (conditions.length > 0) {
                sql += ' AND ' + conditions.join(' AND ');
            }
            
            sql += ' ORDER BY id DESC';
            
            const [rows] = await pool.query(sql, queryParams);
            console.log('[Media] Found', rows.length, 'insights');
            
            sendJSON(res, 200, { 
                success: true,
                insights: rows,
                count: rows.length
            });
        } else {
            const defaultInsights = getDefaultInsights();
            sendJSON(res, 200, { 
                success: true,
                insights: storage.mediaInsights.length > 0 ? storage.mediaInsights : defaultInsights,
                count: storage.mediaInsights.length > 0 ? storage.mediaInsights.length : defaultInsights.length
            });
        }
    } catch (error) {
        console.error('[Media Insights Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ===== GET SINGLE NEWS ARTICLE =====
async function handleGetSingleNews(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const id = params.id;

        console.log('[Get Single News] ID:', id);

        if (!id) {
            sendJSON(res, 400, { success: false, error: 'Article ID is required' });
            return;
        }

        if (dbConnected && pool) {
            const [rows] = await pool.query(
                'SELECT * FROM media_news WHERE id = ? AND is_active = TRUE',
                [id]
            );

            console.log('[Get Single News] Found:', rows ? rows.length : 0);

            if (rows && rows.length > 0) {
                sendJSON(res, 200, {
                    success: true,
                    article: rows[0]
                });
            } else {
                sendJSON(res, 404, { success: false, error: 'Article not found' });
            }
        } else {
            sendJSON(res, 500, { success: false, error: 'Database not connected' });
        }
    } catch (error) {
        console.error('[Get Single News Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ===== GET SINGLE INSIGHT =====
async function handleGetSingleInsight(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const id = params.id;

        console.log('[Get Single Insight] ID:', id);

        if (!id) {
            sendJSON(res, 400, { success: false, error: 'Insight ID is required' });
            return;
        }

        if (dbConnected && pool) {
            const [rows] = await pool.query(
                'SELECT * FROM media_insights WHERE id = ? AND is_active = TRUE',
                [id]
            );

            console.log('[Get Single Insight] Found:', rows ? rows.length : 0);

            if (rows && rows.length > 0) {
                sendJSON(res, 200, {
                    success: true,
                    article: rows[0]
                });
            } else {
                sendJSON(res, 404, { success: false, error: 'Insight not found' });
            }
        } else {
            sendJSON(res, 500, { success: false, error: 'Database not connected' });
        }
    } catch (error) {
        console.error('[Get Single Insight Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ===== POST: Create News =====
function handleCreateNews(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Media Create News] Received:', data);
            
            if (!data.title || !data.category || !data.date || !data.alert || !data.description) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Title, category, date, alert, and description are required' 
                });
                return;
            }
            
            if (dbConnected && pool) {
                const [result] = await pool.query(
                    `INSERT INTO media_news 
                     (title, category, date, alert, description, source, content_type) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        data.title.trim(),
                        data.category,
                        data.date,
                        data.alert,
                        data.description.trim(),
                        data.source || '',
                        data.content_type || 'Marketing'
                    ]
                );
                
                console.log('[Media Create News] ✅ Saved to database! ID:', result.insertId);
                sendJSON(res, 200, {
                    success: true,
                    message: 'News article created successfully',
                    id: result.insertId
                });
            } else {
                storage.mediaNews = storage.mediaNews || getDefaultNews();
                const newNews = {
                    id: storage.mediaNews.length + 1,
                    title: data.title,
                    category: data.category,
                    date: data.date,
                    alert: data.alert,
                    description: data.description,
                    source: data.source || '',
                    content_type: data.content_type || 'Marketing',
                    is_active: true
                };
                storage.mediaNews.push(newNews);
                sendJSON(res, 200, {
                    success: true,
                    message: 'News article created (fallback)',
                    id: newNews.id
                });
            }
        } catch (e) {
            console.error('[Media Create News Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== POST: Create Insight =====
function handleCreateInsight(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Media Create Insight] Received:', data);
            
            if (!data.title || !data.category || !data.type || !data.description) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Title, category, type, and description are required' 
                });
                return;
            }
            
            if (dbConnected && pool) {
                const [result] = await pool.query(
                    `INSERT INTO media_insights 
                     (title, category, type, description, author, content_type) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        data.title.trim(),
                        data.category,
                        data.type,
                        data.description.trim(),
                        data.author || '',
                        data.content_type || 'Marketing'
                    ]
                );
                
                console.log('[Media Create Insight] ✅ Saved to database! ID:', result.insertId);
                sendJSON(res, 200, {
                    success: true,
                    message: 'Insight created successfully',
                    id: result.insertId
                });
            } else {
                storage.mediaInsights = storage.mediaInsights || getDefaultInsights();
                const newInsight = {
                    id: storage.mediaInsights.length + 1,
                    title: data.title,
                    category: data.category,
                    type: data.type,
                    description: data.description,
                    author: data.author || '',
                    content_type: data.content_type || 'Marketing',
                    is_active: true
                };
                storage.mediaInsights.push(newInsight);
                sendJSON(res, 200, {
                    success: true,
                    message: 'Insight created (fallback)',
                    id: newInsight.id
                });
            }
        } catch (e) {
            console.error('[Media Create Insight Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== PUT: Update News =====
function handleUpdateNews(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Media Update News] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'News ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                let updates = [];
                let params = [];
                
                if (data.title) { updates.push('title = ?'); params.push(data.title); }
                if (data.category) { updates.push('category = ?'); params.push(data.category); }
                if (data.date) { updates.push('date = ?'); params.push(data.date); }
                if (data.alert) { updates.push('alert = ?'); params.push(data.alert); }
                if (data.description) { updates.push('description = ?'); params.push(data.description); }
                if (data.source !== undefined) { updates.push('source = ?'); params.push(data.source); }
                if (data.content_type) { updates.push('content_type = ?'); params.push(data.content_type); }
                if (data.is_active !== undefined) { updates.push('is_active = ?'); params.push(data.is_active); }
                
                if (updates.length === 0) {
                    sendJSON(res, 400, { success: false, error: 'No fields to update' });
                    return;
                }
                
                params.push(data.id);
                const [result] = await pool.query(
                    `UPDATE media_news SET ${updates.join(', ')} WHERE id = ?`,
                    params
                );
                
                console.log('[Media Update News] ✅ Updated news ID:', data.id);
                sendJSON(res, 200, {
                    success: true,
                    message: 'News updated successfully',
                    affected_rows: result.affectedRows
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Media Update News Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== PUT: Update Insight =====
function handleUpdateInsight(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Media Update Insight] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'Insight ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                let updates = [];
                let params = [];
                
                if (data.title) { updates.push('title = ?'); params.push(data.title); }
                if (data.category) { updates.push('category = ?'); params.push(data.category); }
                if (data.type) { updates.push('type = ?'); params.push(data.type); }
                if (data.description) { updates.push('description = ?'); params.push(data.description); }
                if (data.author !== undefined) { updates.push('author = ?'); params.push(data.author); }
                if (data.content_type) { updates.push('content_type = ?'); params.push(data.content_type); }
                if (data.is_active !== undefined) { updates.push('is_active = ?'); params.push(data.is_active); }
                
                if (updates.length === 0) {
                    sendJSON(res, 400, { success: false, error: 'No fields to update' });
                    return;
                }
                
                params.push(data.id);
                const [result] = await pool.query(
                    `UPDATE media_insights SET ${updates.join(', ')} WHERE id = ?`,
                    params
                );
                
                console.log('[Media Update Insight] ✅ Updated insight ID:', data.id);
                sendJSON(res, 200, {
                    success: true,
                    message: 'Insight updated successfully',
                    affected_rows: result.affectedRows
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Media Update Insight Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== DELETE: News =====
function handleDeleteNews(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Media Delete News] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'News ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                const [result] = await pool.query(
                    `UPDATE media_news SET is_active = FALSE WHERE id = ?`,
                    [data.id]
                );
                
                console.log('[Media Delete News] ✅ Deactivated news ID:', data.id);
                sendJSON(res, 200, {
                    success: true,
                    message: 'News deleted successfully',
                    affected_rows: result.affectedRows
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Media Delete News Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== DELETE: Insight =====
function handleDeleteInsight(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Media Delete Insight] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'Insight ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                const [result] = await pool.query(
                    `UPDATE media_insights SET is_active = FALSE WHERE id = ?`,
                    [data.id]
                );
                
                console.log('[Media Delete Insight] ✅ Deactivated insight ID:', data.id);
                sendJSON(res, 200, {
                    success: true,
                    message: 'Insight deleted successfully',
                    affected_rows: result.affectedRows
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Media Delete Insight Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ==============================================
// ===== MEDIA ADMIN HANDLERS =====
// ==============================================

// ===== ADMIN: Create News =====
async function handleAdminCreateNews(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Create News] Received:', data);
            
            if (!data.title || !data.category || !data.date || !data.alert || !data.description) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Title, category, date, alert, and description are required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Insert with content_type and image
            const [result] = await pool.query(
                `INSERT INTO media_news 
                 (title, category, date, alert, description, source, image, content_type, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [
                    data.title.trim(),
                    data.category,
                    data.date,
                    data.alert,
                    data.description.trim(),
                    data.source || '',
                    data.image || null,
                    data.content_type || 'Marketing'
                ]
            );
            
            console.log('[Admin Create News] ✅ Saved to database! ID:', result.insertId);
            sendJSON(res, 200, {
                success: true,
                message: 'News article created successfully',
                id: result.insertId
            });
            
        } catch (e) {
            console.error('[Admin Create News Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid JSON: ' + e.message 
            });
        }
    });
}

// ===== ADMIN: Create Insight =====
async function handleAdminCreateInsight(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Create Insight] Received:', data);
            
            if (!data.title || !data.category || !data.type || !data.description) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Title, category, type, and description are required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            // Insert with content_type and image
            const [result] = await pool.query(
                `INSERT INTO media_insights 
                 (title, category, type, description, author, image, content_type, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [
                    data.title.trim(),
                    data.category,
                    data.type,
                    data.description.trim(),
                    data.author || '',
                    data.image || null,
                    data.content_type || 'Marketing'
                ]
            );
            
            console.log('[Admin Create Insight] ✅ Saved to database! ID:', result.insertId);
            sendJSON(res, 200, {
                success: true,
                message: 'Insight created successfully',
                id: result.insertId
            });
            
        } catch (e) {
            console.error('[Admin Create Insight Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid JSON: ' + e.message 
            });
        }
    });
}

// ===== ADMIN: Update News =====
async function handleAdminUpdateNews(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Update News] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'News ID is required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            let updates = [];
            let params = [];
            
            if (data.title) { updates.push('title = ?'); params.push(data.title); }
            if (data.category) { updates.push('category = ?'); params.push(data.category); }
            if (data.date) { updates.push('date = ?'); params.push(data.date); }
            if (data.alert) { updates.push('alert = ?'); params.push(data.alert); }
            if (data.description) { updates.push('description = ?'); params.push(data.description); }
            if (data.source !== undefined) { updates.push('source = ?'); params.push(data.source); }
            if (data.content_type) { updates.push('content_type = ?'); params.push(data.content_type); }
            if (data.image !== undefined) { updates.push('image = ?'); params.push(data.image); }
            if (data.is_active !== undefined) { updates.push('is_active = ?'); params.push(data.is_active); }
            
            if (updates.length === 0) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'No fields to update' 
                });
                return;
            }
            
            params.push(data.id);
            const [result] = await pool.query(
                `UPDATE media_news SET ${updates.join(', ')} WHERE id = ?`,
                params
            );
            
            console.log('[Admin Update News] ✅ Updated news ID:', data.id);
            sendJSON(res, 200, {
                success: true,
                message: 'News updated successfully',
                affected_rows: result.affectedRows
            });
            
        } catch (e) {
            console.error('[Admin Update News Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid JSON: ' + e.message 
            });
        }
    });
}

// ===== ADMIN: Update Insight =====
async function handleAdminUpdateInsight(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Update Insight] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Insight ID is required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            let updates = [];
            let params = [];
            
            if (data.title) { updates.push('title = ?'); params.push(data.title); }
            if (data.category) { updates.push('category = ?'); params.push(data.category); }
            if (data.type) { updates.push('type = ?'); params.push(data.type); }
            if (data.description) { updates.push('description = ?'); params.push(data.description); }
            if (data.author !== undefined) { updates.push('author = ?'); params.push(data.author); }
            if (data.content_type) { updates.push('content_type = ?'); params.push(data.content_type); }
            if (data.image !== undefined) { updates.push('image = ?'); params.push(data.image); }
            if (data.is_active !== undefined) { updates.push('is_active = ?'); params.push(data.is_active); }
            
            if (updates.length === 0) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'No fields to update' 
                });
                return;
            }
            
            params.push(data.id);
            const [result] = await pool.query(
                `UPDATE media_insights SET ${updates.join(', ')} WHERE id = ?`,
                params
            );
            
            console.log('[Admin Update Insight] ✅ Updated insight ID:', data.id);
            sendJSON(res, 200, {
                success: true,
                message: 'Insight updated successfully',
                affected_rows: result.affectedRows
            });
            
        } catch (e) {
            console.error('[Admin Update Insight Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid JSON: ' + e.message 
            });
        }
    });
}

// ===== ADMIN: Delete News =====
async function handleAdminDeleteNews(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Delete News] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'News ID is required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            const [result] = await pool.query(
                `UPDATE media_news SET is_active = FALSE WHERE id = ?`,
                [data.id]
            );
            
            console.log('[Admin Delete News] ✅ Deactivated news ID:', data.id);
            sendJSON(res, 200, {
                success: true,
                message: 'News deleted successfully',
                affected_rows: result.affectedRows
            });
            
        } catch (e) {
            console.error('[Admin Delete News Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid JSON: ' + e.message 
            });
        }
    });
}

// ===== ADMIN: Delete Insight =====
async function handleAdminDeleteInsight(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Admin Delete Insight] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Insight ID is required' 
                });
                return;
            }
            
            if (!dbConnected || !pool) {
                sendJSON(res, 500, { 
                    success: false, 
                    error: 'Database not connected' 
                });
                return;
            }
            
            const [result] = await pool.query(
                `UPDATE media_insights SET is_active = FALSE WHERE id = ?`,
                [data.id]
            );
            
            console.log('[Admin Delete Insight] ✅ Deactivated insight ID:', data.id);
            sendJSON(res, 200, {
                success: true,
                message: 'Insight deleted successfully',
                affected_rows: result.affectedRows
            });
            
        } catch (e) {
            console.error('[Admin Delete Insight Error]', e);
            sendJSON(res, 400, { 
                success: false, 
                error: 'Invalid JSON: ' + e.message 
            });
        }
    });
}

// ==============================================
// ===== DEFAULT DATA FUNCTIONS =====
// ==============================================

function getDefaultNews() {
    return [
        { id: 1, title: "Digital Marketing Trends 2024", category: "Technology", date: "2024-03-15", alert: "not-causing", description: "Latest trends in digital marketing that will shape the industry this year.", source: "TechCrunch", content_type: "Marketing" },
        { id: 2, title: "E-commerce Boom in Africa", category: "E-commerce", date: "2024-03-10", alert: "causing", description: "Rapid growth of e-commerce platforms across African markets causing major shifts.", source: "Business Daily", content_type: "Marketing" },
        { id: 3, title: "Healthcare Tech Revolution", category: "Healthcare", date: "2024-03-05", alert: "not-causing", description: "New technologies transforming healthcare delivery and patient care.", source: "Health Tech Magazine", content_type: "Restructuring" },
        { id: 4, title: "Real Estate Market Update", category: "Real Estate", date: "2024-02-28", alert: "causing", description: "Property prices surge causing alarm among potential homebuyers.", source: "Property Weekly", content_type: "Restructuring" },
        { id: 5, title: "EdTech Growth Statistics", category: "Education", date: "2024-02-20", alert: "not-causing", description: "Educational technology sector shows remarkable growth.", source: "EdSurge", content_type: "Marketing" },
        { id: 6, title: "AI in Marketing", category: "Technology", date: "2024-03-12", alert: "causing", description: "AI adoption causing disruption in traditional marketing roles.", source: "Wired", content_type: "Marketing" }
    ];
}

function getDefaultInsights() {
    return [
        { id: 1, title: "Future of Digital Commerce", category: "E-commerce", type: "Trend Analysis", description: "In-depth analysis of where e-commerce is heading in the next 5 years.", author: "Dr. Sarah Johnson", content_type: "Marketing" },
        { id: 2, title: "Tech Industry Disruption", category: "Technology", type: "Market Research", description: "How emerging technologies are reshaping the tech landscape.", author: "Mark Thompson", content_type: "Marketing" },
        { id: 3, title: "Healthcare Digital Transformation", category: "Healthcare", type: "Case Study", description: "Case study of successful digital transformation in healthcare.", author: "Dr. James Wilson", content_type: "Restructuring" },
        { id: 4, title: "Real Estate Investment Strategies", category: "Real Estate", type: "Expert Opinion", description: "Expert insights on real estate investment opportunities.", author: "Lisa Martinez", content_type: "Restructuring" },
        { id: 5, title: "Educational Technology Trends", category: "Education", type: "Trend Analysis", description: "Latest trends and innovations in educational technology.", author: "Prof. David Chen", content_type: "Marketing" }
    ];
}

// ==============================================
// ===== ANALYTICS HANDLERS =====
// ==============================================

async function handleTrackPageView(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const visitorId = getVisitorId(req, res);
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            if (dbConnected && pool) {
                await pool.query(
                    `INSERT INTO page_views 
                     (visitor_id, page_url, page_title, referrer_url, ip_address, user_agent) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [visitorId, data.pageUrl || '', data.pageTitle || '', data.referrerUrl || '', ipAddress, userAgent]
                );
                await updateDailyStats(visitorId, 'page_view');
                sendJSON(res, 200, { success: true });
            } else {
                storage.pageViews.push({ visitorId, pageUrl: data.pageUrl, pageTitle: data.pageTitle, timestamp: new Date().toISOString() });
                sendJSON(res, 200, { success: true });
            }
        } catch (e) {
            console.error('[Track Page View Error]', e);
            sendJSON(res, 400, { error: 'Invalid JSON: ' + e.message });
        }
    });
}

async function handleTrackClick(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const visitorId = getVisitorId(req, res);
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            if (dbConnected && pool) {
                await pool.query(
                    `INSERT INTO click_events 
                     (visitor_id, element_id, element_class, element_text, page_url, ip_address, user_agent) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [visitorId, data.elementId || '', data.elementClass || '', data.elementText || '', data.pageUrl || '', ipAddress, userAgent]
                );
                await updateDailyStats(visitorId, 'click');
                sendJSON(res, 200, { success: true });
            } else {
                storage.clicks.push({ visitorId, elementId: data.elementId, elementText: data.elementText, timestamp: new Date().toISOString() });
                sendJSON(res, 200, { success: true });
            }
        } catch (e) {
            console.error('[Track Click Error]', e);
            sendJSON(res, 400, { error: 'Invalid JSON: ' + e.message });
        }
    });
}

async function handleTrackFormSubmit(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const visitorId = getVisitorId(req, res);
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            if (dbConnected && pool) {
                await pool.query(
                    `INSERT INTO form_submissions 
                     (visitor_id, form_type, form_data, ip_address, user_agent) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [visitorId, data.formType || 'unknown', JSON.stringify(data.formData || {}), ipAddress, userAgent]
                );
                await updateDailyStats(visitorId, 'submission');
                sendJSON(res, 200, { success: true });
            } else {
                storage.formSubmissions.push({ visitorId, formType: data.formType, formData: data.formData, timestamp: new Date().toISOString() });
                sendJSON(res, 200, { success: true });
            }
        } catch (e) {
            console.error('[Track Form Submit Error]', e);
            sendJSON(res, 400, { error: 'Invalid JSON: ' + e.message });
        }
    });
}

async function handleGetAnalytics(req, res) {
    console.log('[Analytics] Fetching analytics data...');
    
    try {
        if (dbConnected && pool) {
            const [totalVisitors] = await pool.query('SELECT COUNT(DISTINCT visitor_id) as count FROM page_views');
            const [totalPageViews] = await pool.query('SELECT COUNT(*) as count FROM page_views');
            const [totalClicks] = await pool.query('SELECT COUNT(*) as count FROM click_events');
            const [totalSubmissions] = await pool.query('SELECT COUNT(*) as count FROM form_submissions');
            
            const [recentPageViews] = await pool.query(`
                SELECT 'page_view' as type, page_url as page, '' as details, visitor_id, created_at as time
                FROM page_views ORDER BY created_at DESC LIMIT 20
            `);

            const [recentClicks] = await pool.query(`
                SELECT 'click' as type, page_url as page, CONCAT(IFNULL(element_text, ''), ' (', IFNULL(element_id, ''), ')') as details, visitor_id, created_at as time
                FROM click_events ORDER BY created_at DESC LIMIT 20
            `);

            const [recentSubmissions] = await pool.query(`
                SELECT 'form_submit' as type, form_type as page, CONCAT('Form: ', form_type) as details, visitor_id, created_at as time
                FROM form_submissions ORDER BY created_at DESC LIMIT 20
            `);

            let allActions = [...recentPageViews, ...recentClicks, ...recentSubmissions];
            allActions.sort((a, b) => new Date(b.time) - new Date(a.time));
            allActions = allActions.slice(0, 50);

            const [topClicks] = await pool.query(`
                SELECT element_text, COUNT(*) as count FROM click_events
                WHERE element_text IS NOT NULL AND element_text != ''
                GROUP BY element_text ORDER BY count DESC LIMIT 10
            `);

            const [topPages] = await pool.query(`
                SELECT page_url, COUNT(*) as count FROM page_views
                GROUP BY page_url ORDER BY count DESC LIMIT 10
            `);

            const [dailyStats] = await pool.query(`
                SELECT stat_date, total_visitors, total_page_views, total_clicks, total_submissions, unique_visitors
                FROM daily_stats ORDER BY stat_date DESC LIMIT 30
            `);

            const [actionBreakdown] = await pool.query(`
                SELECT 'page_view' as action_type, COUNT(*) as count FROM page_views
                UNION ALL SELECT 'click' as action_type, COUNT(*) as count FROM click_events
                UNION ALL SELECT 'form_submit' as action_type, COUNT(*) as count FROM form_submissions
            `);

            sendJSON(res, 200, {
                success: true,
                stats: {
                    total_visitors: totalVisitors[0]?.count || 0,
                    total_page_views: totalPageViews[0]?.count || 0,
                    total_clicks: totalClicks[0]?.count || 0,
                    total_submissions: totalSubmissions[0]?.count || 0
                },
                recent_actions: allActions,
                top_clicks: topClicks || [],
                top_pages: topPages || [],
                daily_stats: dailyStats || [],
                action_breakdown: actionBreakdown || []
            });
        } else {
            sendJSON(res, 200, { success: true, stats: { total_visitors: 0, total_page_views: 0, total_clicks: 0, total_submissions: 0 } });
        }
    } catch (error) {
        console.error('[Analytics Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

async function handleAdminLogin(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const { password } = data;
            const adminPassword = '12345678';
            
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            if (password === adminPassword) {
                if (dbConnected && pool) {
                    await pool.query(
                        `INSERT INTO admin_logins (username, ip_address, user_agent, login_status) 
                         VALUES (?, ?, ?, 'success')`,
                        ['admin', ipAddress, userAgent]
                    );
                }
                sendJSON(res, 200, { success: true, message: 'Login successful' });
            } else {
                if (dbConnected && pool) {
                    await pool.query(
                        `INSERT INTO admin_logins (username, ip_address, user_agent, login_status) 
                         VALUES (?, ?, ?, 'failed')`,
                        ['admin', ipAddress, userAgent]
                    );
                }
                sendJSON(res, 401, { success: false, error: 'Invalid password' });
            }
        } catch (e) {
            console.error('[Admin Login Error]', e);
            sendJSON(res, 400, { error: 'Invalid request' });
        }
    });
}

async function updateDailyStats(visitorId, actionType) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const [existing] = await pool.query('SELECT id FROM daily_stats WHERE stat_date = ?', [today]);
        
        if (existing && existing.length > 0) {
            let updates = [];
            if (actionType === 'page_view') {
                updates.push('total_page_views = total_page_views + 1');
                const [visitorCheck] = await pool.query(
                    'SELECT COUNT(*) as count FROM page_views WHERE visitor_id = ? AND DATE(created_at) = ?',
                    [visitorId, today]
                );
                if (visitorCheck[0].count <= 1) updates.push('unique_visitors = unique_visitors + 1');
            } else if (actionType === 'click') {
                updates.push('total_clicks = total_clicks + 1');
            } else if (actionType === 'submission') {
                updates.push('total_submissions = total_submissions + 1');
            }
            await pool.query(`UPDATE daily_stats SET ${updates.join(', ')} WHERE stat_date = ?`, [today]);
        } else {
            await pool.query(
                `INSERT INTO daily_stats (stat_date, total_page_views, total_clicks, total_submissions, unique_visitors) 
                 VALUES (?, ?, ?, ?, ?)`,
                [today, actionType === 'page_view' ? 1 : 0, actionType === 'click' ? 1 : 0, actionType === 'submission' ? 1 : 0, 1]
            );
        }
    } catch (error) {
        console.error('[Update Daily Stats Error]', error);
    }
}

// ==============================================
// ===== COURSE INQUIRY HANDLERS (EDULINK) =====
// ==============================================

function handleSubmitInquiry(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Inquiry] Received:', data);
            
            if (!data.fullName || !data.email || !data.course || !data.message) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Full name, email, course, and message are required' 
                });
                return;
            }
            
            const visitorId = getVisitorId(req, res);
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            if (dbConnected && pool) {
                try {
                    const [result] = await pool.query(
                        `INSERT INTO course_inquiries 
                         (full_name, email, phone, course, message, status, created_at) 
                         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
                        [
                            data.fullName.trim(),
                            data.email.trim(),
                            data.phone || '',
                            data.course,
                            data.message.trim()
                        ]
                    );
                    
                    console.log('[Inquiry] ✅ Saved to database! ID:', result.insertId);
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Your inquiry has been sent successfully! We will respond within 24 hours.',
                        inquiry_id: result.insertId
                    });
                } catch (err) {
                    console.error('[Inquiry DB Error]', err);
                    sendJSON(res, 500, { 
                        success: false, 
                        error: 'Database error: ' + err.message 
                    });
                }
            } else {
                storage.inquiries = storage.inquiries || [];
                storage.inquiries.push({
                    ...data,
                    visitorId,
                    timestamp: new Date().toISOString()
                });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Inquiry sent (fallback mode)',
                    inquiry_id: storage.inquiries.length
                });
            }
        } catch (e) {
            console.error('[Inquiry Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

async function handleGetInquiries(req, res) {
    console.log('[Inquiries] Fetching all inquiries...');
    
    try {
        if (dbConnected && pool) {
            const urlParts = req.url.split('?');
            const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
            const status = params.status;
            
            let sql = 'SELECT * FROM course_inquiries ORDER BY created_at DESC';
            let queryParams = [];
            
            if (status && status !== 'all') {
                sql = 'SELECT * FROM course_inquiries WHERE status = ? ORDER BY created_at DESC';
                queryParams.push(status);
            }
            
            const [rows] = await pool.query(sql, queryParams);
            console.log('[Inquiries] Found', rows.length, 'inquiries');
            
            sendJSON(res, 200, { 
                success: true,
                inquiries: rows,
                count: rows.length
            });
        } else {
            const inquiries = storage.inquiries || [];
            sendJSON(res, 200, { 
                success: true,
                inquiries: inquiries,
                count: inquiries.length
            });
        }
    } catch (error) {
        console.error('[Inquiries Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ===== PUT: Update EDULINK Inquiry Status/Response (Admin) =====
function handleUpdateInquiry(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Update Inquiry] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'Inquiry ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                const [inquiryRows] = await pool.query('SELECT * FROM course_inquiries WHERE id = ?', [data.id]);
                
                if (!inquiryRows || inquiryRows.length === 0) {
                    sendJSON(res, 404, { success: false, error: 'Inquiry not found' });
                    return;
                }
                
                const inquiry = inquiryRows[0];
                
                let updates = [];
                let params = [];
                
                if (data.status) {
                    updates.push('status = ?');
                    params.push(data.status);
                }
                if (data.response !== undefined) {
                    updates.push('response = ?');
                    params.push(data.response);
                    updates.push('responded_at = NOW()');
                }
                
                if (updates.length === 0) {
                    sendJSON(res, 400, { success: false, error: 'No fields to update' });
                    return;
                }
                
                params.push(data.id);
                const [result] = await pool.query(
                    `UPDATE course_inquiries SET ${updates.join(', ')} WHERE id = ?`,
                    params
                );
                
                console.log('[Update Inquiry] ✅ Updated inquiry ID:', data.id);
                
                let emailResult = { success: false, error: 'No email sent' };
                
                if (data.response && data.status === 'responded') {
                    const emailSubject = `Response to your Course Inquiry - ${inquiry.course}`;
                    const emailHtml = generateEdulinkReplyEmail(
                        inquiry.full_name,
                        inquiry.course,
                        data.response,
                        data.adminName || 'EDULINK Team'
                    );
                    const emailText = `Dear ${inquiry.full_name},\n\nThank you for your interest in our courses. We have reviewed your inquiry regarding ${inquiry.course}.\n\n${data.response}\n\nIf you have any further questions, feel free to reply to this email or contact us:\n📞 +254 794914597\n📧 support@edulink.com\n\nBest regards,\n${data.adminName || 'The EDULINK Team'}\nEDULINK Courses`;
                    
                    emailResult = await sendEmailReply(inquiry.email, emailSubject, emailHtml, emailText);
                    
                    if (emailResult.success) {
                        await pool.query(
                            `UPDATE course_inquiries SET email_sent = TRUE WHERE id = ?`,
                            [data.id]
                        );
                    }
                }
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Inquiry updated successfully!',
                    affected_rows: result.affectedRows,
                    email_sent: emailResult.success,
                    email_error: emailResult.error
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Update Inquiry Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ==============================================
// ===== LANVAI INQUIRY HANDLERS =====
// ==============================================

function handleSubmitLanvaiInquiry(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Lanvai Inquiry] Received:', data);
            
            if (!data.fullName || !data.email || !data.subject || !data.message) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Full name, email, subject, and message are required' 
                });
                return;
            }
            
            const visitorId = getVisitorId(req, res);
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            if (dbConnected && pool) {
                try {
                    const [result] = await pool.query(
                        `INSERT INTO lanvai_inquiries 
                         (full_name, email, phone, subject, message, status, created_at) 
                         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
                        [
                            data.fullName.trim(),
                            data.email.trim(),
                            data.phone || '',
                            data.subject,
                            data.message.trim()
                        ]
                    );
                    
                    console.log('[Lanvai Inquiry] ✅ Saved to database! ID:', result.insertId);
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Your message has been sent successfully! We will respond within 24 hours.',
                        inquiry_id: result.insertId
                    });
                } catch (err) {
                    console.error('[Lanvai Inquiry DB Error]', err);
                    sendJSON(res, 500, { 
                        success: false, 
                        error: 'Database error: ' + err.message 
                    });
                }
            } else {
                storage.lanvaiInquiries = storage.lanvaiInquiries || [];
                storage.lanvaiInquiries.push({
                    ...data,
                    visitorId,
                    timestamp: new Date().toISOString()
                });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Message sent (fallback mode)',
                    inquiry_id: storage.lanvaiInquiries.length
                });
            }
        } catch (e) {
            console.error('[Lanvai Inquiry Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

async function handleGetLanvaiInquiries(req, res) {
    console.log('[Lanvai Inquiries] Fetching all inquiries...');
    
    try {
        if (dbConnected && pool) {
            const urlParts = req.url.split('?');
            const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
            const status = params.status;
            
            let sql = 'SELECT * FROM lanvai_inquiries ORDER BY created_at DESC';
            let queryParams = [];
            
            if (status && status !== 'all') {
                sql = 'SELECT * FROM lanvai_inquiries WHERE status = ? ORDER BY created_at DESC';
                queryParams.push(status);
            }
            
            const [rows] = await pool.query(sql, queryParams);
            console.log('[Lanvai Inquiries] Found', rows.length, 'inquiries');
            
            sendJSON(res, 200, { 
                success: true,
                inquiries: rows,
                count: rows.length
            });
        } else {
            const inquiries = storage.lanvaiInquiries || [];
            sendJSON(res, 200, { 
                success: true,
                inquiries: inquiries,
                count: inquiries.length
            });
        }
    } catch (error) {
        console.error('[Lanvai Inquiries Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ===== PUT: Update Lanvai Inquiry Status/Response (Admin) =====
function handleUpdateLanvaiInquiry(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Update Lanvai Inquiry] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'Inquiry ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                const [inquiryRows] = await pool.query('SELECT * FROM lanvai_inquiries WHERE id = ?', [data.id]);
                
                if (!inquiryRows || inquiryRows.length === 0) {
                    sendJSON(res, 404, { success: false, error: 'Inquiry not found' });
                    return;
                }
                
                const inquiry = inquiryRows[0];
                
                let updates = [];
                let params = [];
                
                if (data.status) {
                    updates.push('status = ?');
                    params.push(data.status);
                }
                if (data.response !== undefined) {
                    updates.push('response = ?');
                    params.push(data.response);
                    updates.push('responded_at = NOW()');
                }
                
                if (updates.length === 0) {
                    sendJSON(res, 400, { success: false, error: 'No fields to update' });
                    return;
                }
                
                params.push(data.id);
                const [result] = await pool.query(
                    `UPDATE lanvai_inquiries SET ${updates.join(', ')} WHERE id = ?`,
                    params
                );
                
                console.log('[Update Lanvai Inquiry] ✅ Updated inquiry ID:', data.id);
                
                let emailResult = { success: false, error: 'No email sent' };
                
                if (data.response && data.status === 'responded') {
                    const emailSubject = `Response to your Lanvai Inquiry - ${inquiry.subject}`;
                    const emailHtml = generateLanvaiReplyEmail(
                        inquiry.full_name,
                        inquiry.subject,
                        data.response,
                        data.adminName || 'Lanvai Team'
                    );
                    const emailText = `Dear ${inquiry.full_name},\n\nThank you for contacting Lanvai. We have reviewed your inquiry regarding ${inquiry.subject}.\n\n${data.response}\n\nIf you have any further questions, feel free to reply to this email or contact us:\n📞 +254 794914597\n📧 support@lanvai.com\n\nBest regards,\n${data.adminName || 'The Lanvai Team'}\nLanvai Marketing`;
                    
                    emailResult = await sendEmailReply(inquiry.email, emailSubject, emailHtml, emailText);
                    
                    if (emailResult.success) {
                        await pool.query(
                            `UPDATE lanvai_inquiries SET email_sent = TRUE WHERE id = ?`,
                            [data.id]
                        );
                    }
                }
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Inquiry updated successfully!',
                    affected_rows: result.affectedRows,
                    email_sent: emailResult.success,
                    email_error: emailResult.error
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Update Lanvai Inquiry Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}
// ==============================================
// ===== QUOTE REQUEST HANDLERS =====
// ==============================================

// ===== SUBMIT QUOTE REQUEST =====
function handleSubmitQuote(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Quote Request] Received:', data);
            
            // Validate required fields
            if (!data.fullName || !data.email || !data.phone || !data.serviceType || !data.businessCategory || !data.message) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Full name, email, phone, service type, business category, and message are required' 
                });
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Please enter a valid email address' 
                });
                return;
            }
            
            const visitorId = getVisitorId(req, res);
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            if (dbConnected && pool) {
                try {
                    const [result] = await pool.query(
                        `INSERT INTO quote_requests 
                         (full_name, email, phone, company, service_type, business_category, budget, message, status, created_at) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
                        [
                            data.fullName.trim(),
                            data.email.trim().toLowerCase(),
                            data.phone.trim(),
                            data.company || '',
                            data.serviceType,
                            data.businessCategory,
                            data.budget || '',
                            data.message.trim()
                        ]
                    );
                    
                    console.log('[Quote Request] ✅ Saved to database! ID:', result.insertId);
                    
                    // Send confirmation email to user
                    try {
                        const emailSubject = 'Quote Request Received - Lanvai Experts';
                        const emailHtml = generateQuoteConfirmationEmail(data.fullName, data.serviceType, data.businessCategory);
                        const emailText = `Dear ${data.fullName},\n\nThank you for your quote request. We have received your request for ${data.serviceType} in the ${data.businessCategory} category.\n\nOur team will review your request and get back to you within 24-48 hours.\n\nIf you have any questions, please contact us at support@lanvai.com\n\nBest regards,\nLanvai Team`;
                        
                        await sendEmailReply(data.email, emailSubject, emailHtml, emailText);
                    } catch (emailError) {
                        console.log('[Quote Request] Email not sent:', emailError.message);
                    }
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Your quote request has been sent successfully! We will respond within 24-48 hours.',
                        quote_id: result.insertId
                    });
                } catch (err) {
                    console.error('[Quote Request DB Error]', err);
                    sendJSON(res, 500, { 
                        success: false, 
                        error: 'Database error: ' + err.message 
                    });
                }
            } else {
                // Fallback - save to memory
                storage.quoteRequests = storage.quoteRequests || [];
                storage.quoteRequests.push({
                    ...data,
                    visitorId,
                    timestamp: new Date().toISOString()
                });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Quote request sent (fallback mode)',
                    quote_id: storage.quoteRequests.length
                });
            }
        } catch (e) {
            console.error('[Quote Request Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== GET ALL QUOTE REQUESTS (Admin) =====
async function handleGetQuotes(req, res) {
    console.log('[Quote Requests] Fetching all quote requests...');
    
    try {
        if (dbConnected && pool) {
            const urlParts = req.url.split('?');
            const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
            const status = params.status;
            
            let sql = 'SELECT * FROM quote_requests ORDER BY created_at DESC';
            let queryParams = [];
            
            if (status && status !== 'all') {
                sql = 'SELECT * FROM quote_requests WHERE status = ? ORDER BY created_at DESC';
                queryParams.push(status);
            }
            
            const [rows] = await pool.query(sql, queryParams);
            console.log('[Quote Requests] Found', rows.length, 'quotes');
            
            sendJSON(res, 200, { 
                success: true,
                quotes: rows,
                count: rows.length
            });
        } else {
            const quotes = storage.quoteRequests || [];
            sendJSON(res, 200, { 
                success: true,
                quotes: quotes,
                count: quotes.length
            });
        }
    } catch (error) {
        console.error('[Quote Requests Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ===== UPDATE QUOTE REQUEST (Admin) =====
function handleUpdateQuote(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Update Quote] Received:', data);
            
            if (!data.id) {
                sendJSON(res, 400, { success: false, error: 'Quote ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                const [quoteRows] = await pool.query('SELECT * FROM quote_requests WHERE id = ?', [data.id]);
                
                if (!quoteRows || quoteRows.length === 0) {
                    sendJSON(res, 404, { success: false, error: 'Quote request not found' });
                    return;
                }
                
                const quote = quoteRows[0];
                
                let updates = [];
                let params = [];
                
                if (data.status) {
                    updates.push('status = ?');
                    params.push(data.status);
                }
                if (data.response !== undefined) {
                    updates.push('response = ?');
                    params.push(data.response);
                    updates.push('updated_at = NOW()');
                }
                
                if (updates.length === 0) {
                    sendJSON(res, 400, { success: false, error: 'No fields to update' });
                    return;
                }
                
                params.push(data.id);
                const [result] = await pool.query(
                    `UPDATE quote_requests SET ${updates.join(', ')} WHERE id = ?`,
                    params
                );
                
                console.log('[Update Quote] ✅ Updated quote ID:', data.id);
                
                let emailResult = { success: false, error: 'No email sent' };
                
                if (data.response && data.status === 'responded') {
                    const emailSubject = `Response to your Quote Request - ${quote.service_type}`;
                    const emailHtml = generateQuoteReplyEmail(
                        quote.full_name,
                        quote.service_type,
                        quote.business_category,
                        data.response,
                        data.adminName || 'Lanvai Team'
                    );
                    const emailText = `Dear ${quote.full_name},\n\nThank you for your quote request. We have reviewed your request for ${quote.service_type} in the ${quote.business_category} category.\n\n${data.response}\n\nIf you have any further questions, feel free to reply to this email or contact us:\n📞 +254 794914597\n📧 support@lanvai.com\n\nBest regards,\n${data.adminName || 'The Lanvai Team'}\nLanvai Experts`;
                    
                    emailResult = await sendEmailReply(quote.email, emailSubject, emailHtml, emailText);
                    
                    if (emailResult.success) {
                        await pool.query(
                            `UPDATE quote_requests SET email_sent = TRUE WHERE id = ?`,
                            [data.id]
                        );
                    }
                }
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Quote updated successfully!',
                    affected_rows: result.affectedRows,
                    email_sent: emailResult.success,
                    email_error: emailResult.error
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Update Quote Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== GENERATE QUOTE CONFIRMATION EMAIL =====
function generateQuoteConfirmationEmail(userName, serviceType, businessCategory) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quote Request Received</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f59e0b; }
                .header h1 { color: #1e3a5f; }
                .content { padding: 20px 0; color: #333; line-height: 1.6; }
                .info-box { background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; }
                .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
                .logo-text { font-size: 24px; font-weight: bold; color: #f59e0b; }
                .logo-text span { color: #d97706; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo-text">Lanvai <span>Experts</span></div>
                    <p style="color: #64748b;">Quote Request Confirmation</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>Thank you for submitting a quote request on Lanvai Experts.</p>
                    <div class="info-box">
                        <p><strong>Service Type:</strong> ${serviceType}</p>
                        <p><strong>Business Category:</strong> ${businessCategory}</p>
                    </div>
                    <p>Our team will review your request and get back to you within <strong>24-48 hours</strong> with a detailed quote.</p>
                    <p>If you have any questions, feel free to contact us:</p>
                    <p>
                        📞 <strong>+254 794914597</strong><br>
                        📧 <strong>support@lanvai.com</strong>
                    </p>
                    <p>We look forward to working with you!</p>
                    <p style="margin-top: 20px;">
                        Best regards,<br>
                        <strong>The Lanvai Team</strong>
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Lanvai | Smart Solutions for Smart Businesses</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ===== GENERATE QUOTE REPLY EMAIL =====
function generateQuoteReplyEmail(userName, serviceType, businessCategory, replyMessage, adminName) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Response to Your Quote Request</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f59e0b; }
                .header h1 { color: #1e3a5f; }
                .content { padding: 20px 0; color: #333; line-height: 1.6; }
                .message-box { background: #fef3c7; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; }
                .message-box p { margin: 0; white-space: pre-wrap; }
                .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
                .info-item { background: #f8fafc; padding: 8px 12px; border-radius: 6px; }
                .logo-text { font-size: 24px; font-weight: bold; color: #f59e0b; }
                .logo-text span { color: #d97706; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo-text">Lanvai <span>Experts</span></div>
                    <p style="color: #64748b;">Quote Response</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>Thank you for your quote request. We have reviewed your request for <strong>${serviceType}</strong> in the <strong>${businessCategory}</strong> category.</p>
                    <div class="message-box">
                        <p>${replyMessage}</p>
                    </div>
                    <div class="info-grid">
                        <div class="info-item"><strong>📋 Service:</strong> ${serviceType}</div>
                        <div class="info-item"><strong>📊 Category:</strong> ${businessCategory}</div>
                    </div>
                    <p>If you have any further questions, feel free to reply to this email or contact us:</p>
                    <p>
                        📞 <strong>+254 794914597</strong><br>
                        📧 <strong>support@lanvai.com</strong><br>
                        📍 <strong>Thika Road Wendani, Nairobi, Kenya</strong>
                    </p>
                    <p style="margin-top: 20px;">
                        Best regards,<br>
                        <strong>${adminName || 'The Lanvai Team'}</strong><br>
                        Lanvai Experts
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Lanvai | Smart Solutions for Smart Businesses</p>
                    <p style="font-size: 11px; color: #94a3b8;">This email was sent in response to your quote request.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ==============================================
// ===== GENERATE EDULINK REPLY EMAIL HTML =====
// ==============================================

function generateEdulinkReplyEmail(userName, courseName, replyMessage, adminName) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reply from EDULINK</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
                .header h1 { color: #1e3a5f; font-size: 24px; }
                .header .subtitle { color: #64748b; font-size: 14px; }
                .content { padding: 20px 0; color: #333; line-height: 1.6; }
                .message-box { background: #eff6ff; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 15px 0; }
                .message-box p { margin: 0; white-space: pre-wrap; }
                .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
                .info-item { background: #f8fafc; padding: 8px 12px; border-radius: 6px; }
                .info-item strong { color: #1e3a5f; }
                .logo-text { font-size: 20px; font-weight: bold; color: #2563eb; }
                .logo-text span { color: #059669; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo-text">EDULINK <span>Courses</span></div>
                    <p class="subtitle">Your Course Inquiry Response</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>Thank you for your interest in our courses. We have reviewed your inquiry regarding <strong>${courseName}</strong>.</p>
                    <div class="message-box">
                        <p>${replyMessage}</p>
                    </div>
                    <div class="info-grid">
                        <div class="info-item"><strong>📚 Course:</strong> ${courseName}</div>
                        <div class="info-item"><strong>📧 Email:</strong> support@edulink.com</div>
                    </div>
                    <p>If you have any further questions, feel free to reply to this email or contact us:</p>
                    <p>
                        📞 <strong>+254 794914597</strong><br>
                        📧 <strong>support@edulink.com</strong><br>
                        📍 <strong>Thika Road Wendani, Nairobi, Kenya</strong>
                    </p>
                    <p>We look forward to helping you achieve your learning goals!</p>
                    <p style="margin-top: 20px;">
                        Best regards,<br>
                        <strong>${adminName || 'The EDULINK Team'}</strong><br>
                        EDULINK Courses
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 EDULINK | Smart Solutions for Smart Learners</p>
                    <p style="font-size: 11px; color: #94a3b8;">This email was sent in response to your course inquiry.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ===== GENERATE LANVAI REPLY EMAIL HTML =====
function generateLanvaiReplyEmail(userName, subject, replyMessage, adminName) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reply from Lanvai</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #7c3aed; }
                .header h1 { color: #1e3a5f; font-size: 24px; }
                .header .subtitle { color: #64748b; font-size: 14px; }
                .content { padding: 20px 0; color: #333; line-height: 1.6; }
                .message-box { background: #f5f3ff; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #7c3aed; margin: 15px 0; }
                .message-box p { margin: 0; white-space: pre-wrap; }
                .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
                .info-item { background: #f8fafc; padding: 8px 12px; border-radius: 6px; }
                .info-item strong { color: #1e3a5f; }
                .logo-text { font-size: 20px; font-weight: bold; color: #7c3aed; }
                .logo-text span { color: #6d28d9; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo-text">Lanvai <span>Marketing</span></div>
                    <p class="subtitle">Your Inquiry Response</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>Thank you for contacting Lanvai. We have reviewed your inquiry regarding <strong>${subject}</strong>.</p>
                    <div class="message-box">
                        <p>${replyMessage}</p>
                    </div>
                    <div class="info-grid">
                        <div class="info-item"><strong>📋 Subject:</strong> ${subject}</div>
                        <div class="info-item"><strong>📧 Email:</strong> support@lanvai.com</div>
                    </div>
                    <p>If you have any further questions, feel free to reply to this email or contact us:</p>
                    <p>
                        📞 <strong>+254 794914597</strong><br>
                        📧 <strong>support@lanvai.com</strong><br>
                        📍 <strong>Thika Road Wendani, Nairobi, Kenya</strong>
                    </p>
                    <p>We look forward to serving you!</p>
                    <p style="margin-top: 20px;">
                        Best regards,<br>
                        <strong>${adminName || 'The Lanvai Team'}</strong><br>
                        Lanvai Marketing
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Lanvai | Smart Solutions for Smart Businesses</p>
                    <p style="font-size: 11px; color: #94a3b8;">This email was sent in response to your inquiry.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ==============================================
// ===== EXISTING API HANDLERS =====
// ==============================================

// ===== HANDLER: Courses =====
async function handleCourses(req, res) {
    console.log('[Courses] Fetching all courses...');
    
    try {
        if (dbConnected && pool) {
            const [institutionCourses] = await pool.query(`
                SELECT 
                    ihc.*,
                    i.institution_name,
                    'institution' as hosted_type
                FROM institution_hosted_courses ihc
                LEFT JOIN institutions i ON ihc.institution_id = i.id
                WHERE ihc.is_active = TRUE
            `);

            const [lanvaiCourses] = await pool.query(`
                SELECT 
                    lhc.*,
                    'lanvai' as hosted_type,
                    lhc.enrollment_type
                FROM lanvai_hosted_courses lhc
                WHERE lhc.is_active = TRUE AND (lhc.review_status = 'approved' OR lhc.review_status IS NULL)
            `);

            const allCourses = [];
            
            if (institutionCourses && institutionCourses.length > 0) {
                institutionCourses.forEach(row => {
                    allCourses.push({
                        id: 'inst_' + row.id,
                        name: row.course_name || 'Unnamed Course',
                        institution: row.institution_name || 'Unknown Institution',
                        category: row.category || 'General',
                        mode: row.enrollment_type && row.enrollment_type.includes('online') ? 'Online' : 
                              row.enrollment_type && row.enrollment_type.includes('physical') ? 'Offline' : 'Hybrid',
                        studyType: row.enrollment_type && row.enrollment_type.includes('Fulltime') ? 'Full-time' : 'Part-time',
                        price: parseFloat(row.cost_per_year) || 0,
                        branch: row.branch_offering || 'Main Campus',
                        address: row.branch_offering || 'Nairobi, Kenya',
                        lat: -1.2921,
                        lng: 36.8219,
                        intakeDate: row.intake_date || '2025-09',
                        clusterPoints: parseInt(row.cluster_points) || 0,
                        duration: parseFloat(row.period_years) || 1,
                        hostedType: 'institution',
                        source: 'database',
                        enrollmentType: row.enrollment_type || '',
                        about: row.institution_name ? `${row.institution_name} is a registered institution on EDULINK` : 'Registered Institution',
                        description: row.course_name || 'Course description not available'
                    });
                });
            }

            if (lanvaiCourses && lanvaiCourses.length > 0) {
                lanvaiCourses.forEach(row => {
                    let enrollmentType = row.enrollment_type || '';
                    if (!enrollmentType) {
                        let et = (row.delivery_mode || 'online').toLowerCase();
                        et += (row.admission || 'Rolling');
                        et += (row.study || 'Fulltime');
                        enrollmentType = et;
                    }
                    
                    allCourses.push({
                        id: 'lanvai_' + row.id,
                        name: row.course_name || 'Unnamed Course',
                        institution: row.institution_name || 'EDULINK Hosted',
                        category: row.category || 'General',
                        mode: row.delivery_mode || 'Online',
                        studyType: row.study || 'Full-time',
                        price: parseFloat(row.price) || 0,
                        branch: 'Online',
                        address: 'Remote',
                        lat: 0,
                        lng: 0,
                        intakeDate: row.admission === 'Intake' ? '2025-09' : 'Flexible',
                        clusterPoints: 0,
                        duration: parseFloat(row.semesters) || 1,
                        hostedType: 'lanvai',
                        source: 'database',
                        enrollmentType: enrollmentType,
                        about: row.about_us || 'EDULINK hosted course',
                        description: row.about_us || 'Course hosted on EDULINK platform',
                        topics: row.topics ? JSON.parse(row.topics) : []
                    });
                });
            }

            console.log('[Courses] Found', allCourses.length, 'courses from database');
            
            sendJSON(res, 200, { 
                courses: allCourses,
                source: 'database',
                count: allCourses.length,
                institution_count: institutionCourses ? institutionCourses.length : 0,
                lanvai_count: lanvaiCourses ? lanvaiCourses.length : 0
            });
        } else {
            console.log('[Courses] Database not connected, returning default courses');
            const defaultCourses = getDefaultCourses();
            sendJSON(res, 200, { 
                courses: defaultCourses,
                source: 'default',
                count: defaultCourses.length
            });
        }
    } catch (error) {
        console.error('[Courses Error]', error);
        const defaultCourses = getDefaultCourses();
        sendJSON(res, 200, { 
            courses: defaultCourses,
            source: 'fallback',
            count: defaultCourses.length,
            error: error.message
        });
    }
}

// ===== HANDLER: Expert Services =====
async function handleExpertServices(req, res) {
    console.log('[Expert Services] Fetching from database...');
    
    try {
        if (dbConnected && pool) {
            const [rows] = await pool.query(
                'SELECT * FROM expert_services WHERE is_active = TRUE ORDER BY category, service_type, id'
            );
            
            console.log('[Expert Services] Found', rows.length, 'services in database');
            
            const response = {
                success: true,
                marketingServices: {},
                marketingStrategies: {},
                restructuringServices: {},
                restructuringStrategies: {}
            };
            
            if (rows && rows.length > 0) {
                rows.forEach(row => {
                    const category = row.category || '';
                    const serviceType = row.service_type || '';
                    const businessCategory = row.business_category || 'General';
                    
                    const serviceData = {
                        title: row.title || 'Untitled Service',
                        desc: row.description || 'No description available',
                        icon: row.icon || 'fa-cog',
                        is_active: row.is_active === 1
                    };
                    
                    // Map to the correct structure
                    if (category === 'marketing' && serviceType === 'marketing_services') {
                        if (!response.marketingServices[businessCategory]) {
                            response.marketingServices[businessCategory] = [];
                        }
                        response.marketingServices[businessCategory].push(serviceData);
                    } else if (category === 'marketing' && serviceType === 'marketing_strategies') {
                        if (!response.marketingStrategies[businessCategory]) {
                            response.marketingStrategies[businessCategory] = [];
                        }
                        response.marketingStrategies[businessCategory].push(serviceData);
                    } else if (category === 'restructuring' && serviceType === 'restructuring_services') {
                        if (!response.restructuringServices[businessCategory]) {
                            response.restructuringServices[businessCategory] = [];
                        }
                        response.restructuringServices[businessCategory].push(serviceData);
                    } else if (category === 'restructuring' && serviceType === 'restructuring_strategies') {
                        if (!response.restructuringStrategies[businessCategory]) {
                            response.restructuringStrategies[businessCategory] = [];
                        }
                        response.restructuringStrategies[businessCategory].push(serviceData);
                    } else {
                        // Unknown category - add to both as fallback
                        if (!response.marketingServices[businessCategory]) {
                            response.marketingServices[businessCategory] = [];
                        }
                        response.marketingServices[businessCategory].push(serviceData);
                        
                        if (!response.restructuringServices[businessCategory]) {
                            response.restructuringServices[businessCategory] = [];
                        }
                        response.restructuringServices[businessCategory].push(serviceData);
                    }
                });
            }
            
            // Log the final counts
            console.log('[Expert Services] Final counts:');
            console.log('  Marketing Services:', Object.keys(response.marketingServices).length, 'categories');
            console.log('  Marketing Strategies:', Object.keys(response.marketingStrategies).length, 'categories');
            console.log('  Restructuring Services:', Object.keys(response.restructuringServices).length, 'categories');
            console.log('  Restructuring Strategies:', Object.keys(response.restructuringStrategies).length, 'categories');
            
            sendJSON(res, 200, response);
        } else {
            console.log('[Expert Services] Database not connected');
            sendJSON(res, 200, {
                success: false,
                message: 'Database not connected',
                marketingServices: {},
                marketingStrategies: {},
                restructuringServices: {},
                restructuringStrategies: {}
            });
        }
    } catch (error) {
        console.error('[Expert Services Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            message: error.message,
            marketingServices: {},
            marketingStrategies: {},
            restructuringServices: {},
            restructuringStrategies: {}
        });
    }
}
// ===== HANDLER: Ad Packages =====
async function handleAdPackages(req, res) {
    try {
        if (dbConnected && pool) {
            const urlParts = req.url.split('?');
            const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
            const category = params.category;
            
            let sql = 'SELECT * FROM ad_packages WHERE is_active = TRUE';
            let queryParams = [];
            if (category && category !== 'all') {
                sql += ' AND category = ?';
                queryParams.push(category);
            }
            sql += ' ORDER BY price ASC';
            
            const [rows] = await pool.query(sql, queryParams);
            if (rows && rows.length > 0) {
                sendJSON(res, 200, { packages: rows });
            } else {
                sendDefaultPackages(res);
            }
        } else {
            sendDefaultPackages(res);
        }
    } catch (error) {
        console.error('[Ad Packages Error]', error);
        sendDefaultPackages(res);
    }
}

function sendDefaultPackages(res) {
    const defaultPackages = [
        { id: 1, package_name: "Premium Homepage Banner", category: "premium", price: 2500, impressions_estimate: 100000, description: "Prime placement at the top of our homepage.", duration_days: 30 },
        { id: 2, package_name: "Sidebar Banner", category: "standard", price: 800, impressions_estimate: 35000, description: "Strategic sidebar placement visible on every page.", duration_days: 30 },
        { id: 3, package_name: "In-Content Native Ad", category: "native", price: 1200, impressions_estimate: 50000, description: "Seamlessly integrated ads that match content style.", duration_days: 30 },
        { id: 4, package_name: "Newsletter Sponsorship", category: "newsletter", price: 600, impressions_estimate: 20000, description: "Reach our engaged subscriber base directly in their inbox.", duration_days: 30 },
        { id: 5, package_name: "Video Pre-roll Ad", category: "premium", price: 3000, impressions_estimate: 80000, description: "15-second video ads before our premium content.", duration_days: 30 },
        { id: 6, package_name: "Category Page Banner", category: "standard", price: 500, impressions_estimate: 20000, description: "Targeted ads on specific category pages.", duration_days: 30 },
        { id: 7, package_name: "Sponsored Article", category: "native", price: 1800, impressions_estimate: 60000, description: "Full sponsored article written by our team.", duration_days: 30 },
        { id: 8, package_name: "Weekly Spotlight", category: "newsletter", price: 400, impressions_estimate: 15000, description: "Featured placement in our weekly newsletter.", duration_days: 7 }
    ];
    sendJSON(res, 200, { packages: defaultPackages });
}

// ===== HANDLER: Branches =====
async function handleBranches(req, res) {
    console.log('[Branches] Fetching branches...');
    
    try {
        if (dbConnected && pool) {
            const [rows] = await pool.query(`SELECT * FROM branches WHERE is_active = 1`);
            
            const branches = rows.map(row => ({
                id: row.id,
                name: row.name,
                address: row.address,
                lat: parseFloat(row.latitude) || 0,
                lng: parseFloat(row.longitude) || 0,
                latitude: parseFloat(row.latitude) || 0,
                longitude: parseFloat(row.longitude) || 0,
                phone: row.phone,
                email: row.email,
                is_active: row.is_active
            }));
            
            console.log('[Branches] Found', branches.length, 'branches');
            sendJSON(res, 200, { branches });
        } else {
            const branches = [
                { id: 1, name: 'Nairobi Campus', address: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219 },
                { id: 2, name: 'Online Campus', address: 'Remote Learning', lat: 0, lng: 0 },
                { id: 3, name: 'Innovation Hub Lagos', address: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792 }
            ];
            sendJSON(res, 200, { branches });
        }
    } catch (error) {
        console.error('[Branches Error]', error);
        const branches = [
            { id: 1, name: 'Nairobi Campus', address: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219 },
            { id: 2, name: 'Online Campus', address: 'Remote Learning', lat: 0, lng: 0 },
            { id: 3, name: 'Innovation Hub Lagos', address: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792 }
        ];
        sendJSON(res, 200, { branches });
    }
}

// ===== HANDLER: Media Submit =====
function handleMediaSubmit(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Media Submit] Received:', data);
            
            if (!data.full_name || !data.email || !data.phone) {
                sendJSON(res, 400, { error: 'All fields are required' });
                return;
            }

            const visitorId = getVisitorId(req, res);

            if (dbConnected && pool) {
                try {
                    const [result] = await pool.query(
                        `INSERT INTO media_submissions (visitor_id, full_name, email, phone, submission_status) 
                         VALUES (?, ?, ?, ?, 'pending')`,
                        [visitorId, data.full_name, data.email, data.phone]
                    );
                    
                    console.log('[Media Submit] ✅ Saved to database! ID:', result.insertId);
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Media submission saved successfully to database',
                        submission_id: result.insertId
                    });
                } catch (err) {
                    console.error('[Media Submit DB Error]', err);
                    storage.mediaSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Media submission saved (fallback)',
                        submission_id: storage.mediaSubmissions.length
                    });
                }
            } else {
                storage.mediaSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Media submission saved (fallback)',
                    submission_id: storage.mediaSubmissions.length
                });
            }
        } catch (e) {
            console.error('[Media Submit Error]', e);
            sendJSON(res, 400, { error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== HANDLER: Expert Submit =====
function handleExpertSubmit(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Expert Submit] Received:', data);
            
            if (!data.business_category || !data.business_name || !data.email || !data.phone) {
                sendJSON(res, 400, { error: 'All fields are required' });
                return;
            }

            const visitorId = getVisitorId(req, res);

            if (dbConnected && pool) {
                try {
                    const [result] = await pool.query(
                        `INSERT INTO expert_consultations (visitor_id, business_category, business_name, email, phone, consultation_status) 
                         VALUES (?, ?, ?, ?, ?, 'pending')`,
                        [visitorId, data.business_category, data.business_name, data.email, data.phone]
                    );
                    
                    console.log('[Expert Submit] ✅ Saved to database! ID:', result.insertId);
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Expert consultation saved successfully to database',
                        consultation_id: result.insertId
                    });
                } catch (err) {
                    console.error('[Expert Submit DB Error]', err);
                    storage.expertSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Expert consultation saved (fallback)',
                        consultation_id: storage.expertSubmissions.length
                    });
                }
            } else {
                storage.expertSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Expert consultation saved (fallback)',
                    consultation_id: storage.expertSubmissions.length
                });
            }
        } catch (e) {
            console.error('[Expert Submit Error]', e);
            sendJSON(res, 400, { error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== HANDLER: Ad Category Select =====
function handleAdCategorySelect(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Ad Category] Received:', data);
            
            if (!data.category) {
                sendJSON(res, 400, { error: 'Category is required' });
                return;
            }

            const visitorId = getVisitorId(req, res);

            if (dbConnected && pool) {
                try {
                    await pool.query(
                        'INSERT INTO ad_exchange_selections (visitor_id, category) VALUES (?, ?)',
                        [visitorId, data.category]
                    );
                    
                    console.log('[Ad Category] ✅ Saved to database!');
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Category selected successfully',
                        category: data.category
                    });
                } catch (err) {
                    console.error('[Ad Category DB Error]', err);
                    storage.adSelections.push({ category: data.category, visitorId, timestamp: new Date().toISOString() });
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Category selected (fallback)',
                        category: data.category
                    });
                }
            } else {
                storage.adSelections.push({ category: data.category, visitorId, timestamp: new Date().toISOString() });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Category selected (fallback)',
                    category: data.category
                });
            }
        } catch (e) {
            console.error('[Ad Category Error]', e);
            sendJSON(res, 400, { error: 'Invalid JSON: ' + e.message });
        }
    });
}

// ===== HANDLER: Institution Hosted =====
function handleInstitutionHosted(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Institution Hosted] Received:', data);
            
            if (!data.institution || !data.email) {
                sendJSON(res, 400, { error: 'Institution name and email are required' });
                return;
            }
            
            if (!data.branches || data.branches.length === 0) {
                sendJSON(res, 400, { error: 'At least one branch is required' });
                return;
            }

            const visitorId = getVisitorId(req, res);

            if (dbConnected && pool) {
                try {
                    const [existing] = await pool.query('SELECT id FROM institutions WHERE email = ?', [data.email]);
                    let institutionId;
                    
                    if (existing && existing.length > 0) {
                        institutionId = existing[0].id;
                        await pool.query(
                            `UPDATE institutions SET 
                             institution_name = ?, branches = ?, website = ?, is_active = TRUE
                             WHERE id = ?`,
                            [data.institution, JSON.stringify(data.branches), data.website || '', institutionId]
                        );
                    } else {
                        const [result] = await pool.query(
                            `INSERT INTO institutions (institution_name, branches, email, website, is_active, review_status) 
                             VALUES (?, ?, ?, ?, TRUE, 'pending')`,
                            [data.institution, JSON.stringify(data.branches), data.email, data.website || '']
                        );
                        institutionId = result.insertId;
                    }

                    const enrollmentTypes = data.enrollmentTypes || {};
                    let coursesSaved = 0;
                    
                    for (const [type, courses] of Object.entries(enrollmentTypes)) {
                        for (const course of courses) {
                            if (course.name && course.period && course.category && course.branch && course.programType && course.costPerYear && course.intakeDate) {
                                await pool.query(
                                    `INSERT INTO institution_hosted_courses 
                                     (institution_id, enrollment_type, course_name, cluster_points, period_years, 
                                      category, branch_offering, program_type, cost_per_year, intake_date, realtime_videos) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        institutionId,
                                        type,
                                        course.name,
                                        course.cluster || 'Not specified',
                                        parseFloat(course.period) || 1,
                                        course.category,
                                        course.branch,
                                        course.programType,
                                        parseFloat(course.costPerYear) || 0,
                                        course.intakeDate,
                                        JSON.stringify(course.realtimeVideos || [])
                                    ]
                                );
                                coursesSaved++;
                            }
                        }
                    }
                    
                    console.log('[Institution Hosted] ✅ Saved all courses!');
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Institution and courses saved successfully!',
                        courses_saved: coursesSaved
                    });
                } catch (err) {
                    console.error('[Institution Hosted DB Error]', err);
                    storage.institutionHostedSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Data saved to memory (fallback)',
                        fallback: true
                    });
                }
            } else {
                storage.institutionHostedSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                console.log('[Institution Hosted] 💾 Saved to memory (fallback)');
                sendJSON(res, 200, {
                    success: true,
                    message: 'Institution and courses saved (fallback)',
                    fallback: true
                });
            }
        } catch (e) {
            console.error('[Institution Hosted Error]', e);
            sendJSON(res, 400, { error: 'Invalid JSON: ' + e.message });
        }
    });
}



// ===== HANDLER: Cookie Consent =====
function handleCookieConsent(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const visitorId = getVisitorId(req, res);
            const consentType = data.consent_type || 'none';

            storage.cookieConsents[visitorId] = consentType;
            setCookie(res, 'cookie_consent', consentType);
            sendJSON(res, 200, { success: true, consent: consentType });
        } catch (e) {
            console.error('[Cookie Consent Error]', e);
            sendJSON(res, 400, { error: 'Invalid JSON' });
        }
    });
}

// ===== HANDLER: Get Cookie Consent =====
function handleGetCookieConsent(req, res) {
    const visitorId = getCookie(req, 'visitor_id') || 'guest';
    const consent = storage.cookieConsents[visitorId] || 'none';
    sendJSON(res, 200, { consent: consent });
}

// ===== HANDLER: Track =====
function handleTrack(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const visitorId = getVisitorId(req, res);
            const consent = getCookie(req, 'cookie_consent');
            
            if (consent !== 'all') {
                sendJSON(res, 200, { success: true, message: 'Tracking skipped' });
                return;
            }

            storage.userActions.push({ 
                visitorId, 
                actionType: data.event_type || 'track',
                actionDetails: data.event_details || '',
                timestamp: new Date().toISOString()
            });
            sendJSON(res, 200, { success: true });
        } catch (e) {
            console.error('[Track Error]', e);
            sendJSON(res, 200, { success: true });
        }
    });
}

// ==============================================
// ===== LIBRARY HANDLERS =====
// ==============================================

async function handleGetBooks(req, res) {
    console.log('[Library] Fetching all books...');
    
    try {
        if (dbConnected && pool) {
            const urlParts = req.url.split('?');
            const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
            const category = params.category;
            
            let sql = 'SELECT * FROM library_books WHERE is_active = TRUE';
            let queryParams = [];
            
            if (category && category !== 'all' && category !== 'undefined') {
                sql += ' AND category = ?';
                queryParams.push(category);
            }
            
            sql += ' ORDER BY title ASC';
            
            const [rows] = await pool.query(sql, queryParams);
            console.log('[Library] Found', rows.length, 'books');
            
            sendJSON(res, 200, { 
                success: true,
                books: rows,
                count: rows.length
            });
        } else {
            const defaultBooks = getDefaultBooks();
            sendJSON(res, 200, { 
                success: true,
                books: defaultBooks,
                count: defaultBooks.length,
                source: 'default'
            });
        }
    } catch (error) {
        console.error('[Library Books Error]', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message,
            books: getDefaultBooks()
        });
    }
}

async function handleGetCategories(req, res) {
    console.log('[Library] Fetching categories...');
    
    try {
        if (dbConnected && pool) {
            const [rows] = await pool.query('SELECT * FROM book_categories WHERE is_active = TRUE ORDER BY name ASC');
            sendJSON(res, 200, { 
                success: true,
                categories: rows,
                count: rows.length
            });
        } else {
            const defaultCategories = [
                'Novels', 'Short stories', 'Poems', 'Tongue twisters', 'Classic', 
                'Adventure', 'Fantasy', 'Science fiction', 'Detective', 'Children',
                'Historical', 'Philosophy', 'Drama', 'Essays', 'Biography',
                'Fairytales', 'Religion', 'Romance', 'Mystery', 'Professional literature'
            ];
            sendJSON(res, 200, { 
                success: true,
                categories: defaultCategories.map((name, i) => ({ id: i+1, name, description: `${name} books` })),
                count: defaultCategories.length
            });
        }
    } catch (error) {
        console.error('[Categories Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

function handleBookSubmission(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Book Submission] Received:', data);
            
            if (!data.title || !data.author || !data.price || !data.phone) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Title, Author, Price, and Phone are required' 
                });
                return;
            }
            
            const visitorId = getVisitorId(req, res);
            
            if (dbConnected && pool) {
                try {
                    const [result] = await pool.query(
                        `INSERT INTO book_submissions 
                         (title, author, category, book_type, price, year_published, 
                          genre, other_books, phone, email, submission_status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                        [
                            data.title,
                            data.author,
                            data.category || '',
                            data.bookType || 'ebook',
                            parseFloat(data.price) || 0,
                            data.yearPublished || null,
                            data.genre || '',
                            data.otherBooks || '',
                            data.phone,
                            data.email || ''
                        ]
                    );
                    
                    console.log('[Book Submission] ✅ Saved to database! ID:', result.insertId);
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Your book has been submitted for review! We will contact you within 2-3 business days.',
                        submission_id: result.insertId
                    });
                } catch (err) {
                    console.error('[Book Submission DB Error]', err);
                    storage.bookSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Book submitted (fallback mode)',
                        submission_id: storage.bookSubmissions.length
                    });
                }
            } else {
                storage.bookSubmissions.push({ ...data, visitorId, timestamp: new Date().toISOString() });
                sendJSON(res, 200, {
                    success: true,
                    message: 'Book submitted successfully! We will contact you soon.',
                    submission_id: storage.bookSubmissions.length
                });
            }
        } catch (e) {
            console.error('[Book Submission Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON: ' + e.message });
        }
    });
}

async function handleGetSubmissions(req, res) {
    console.log('[Library] Fetching book submissions...');
    
    try {
        if (dbConnected && pool) {
            const [rows] = await pool.query('SELECT * FROM book_submissions ORDER BY created_at DESC');
            sendJSON(res, 200, { 
                success: true,
                submissions: rows,
                count: rows.length
            });
        } else {
            const submissions = storage.bookSubmissions || [];
            sendJSON(res, 200, { 
                success: true,
                submissions: submissions,
                count: submissions.length
            });
        }
    } catch (error) {
        console.error('[Submissions Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ==============================================
// INSTITUTION COURSE MANAGEMENT
// ==============================================

// ===== GET INSTITUTION COURSES =====
// ===== GET INSTITUTION COURSES WITH ANALYTICS =====
async function handleGetInstitutionCourses(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const token = params.token;

        if (!token) {
            sendJSON(res, 401, { success: false, error: 'No session token provided' });
            return;
        }

        global.sessions = global.sessions || {};
        const session = global.sessions[token];

        if (!session || session.user_role !== 'institution') {
            sendJSON(res, 401, { success: false, error: 'Invalid or expired session' });
            return;
        }

        if (dbConnected && pool) {
            const [courses] = await pool.query(
                `SELECT 
                    id, 
                    course_name as name, 
                    category, 
                    price,
                    mode,
                    study_type as studyType,
                    intake_date as intake,
                    status,
                    views,
                    clicks,
                    students,
                    created_at
                 FROM institution_hosted_courses 
                 WHERE institution_id = ? AND is_active = TRUE 
                 ORDER BY created_at DESC`,
                [session.user_id]
            );

            sendJSON(res, 200, {
                success: true,
                courses: courses || []
            });
        } else {
            sendJSON(res, 500, { success: false, error: 'Database not connected' });
        }
    } catch (error) {
        console.error('[Get Institution Courses Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}
// ==============================================
// ===== INSTITUTION ANALYTICS =====
// ==============================================
async function handleInstitutionAnalytics(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const token = params.token;

        if (!token) {
            sendJSON(res, 401, { success: false, error: 'No session token provided' });
            return;
        }

        global.sessions = global.sessions || {};
        const session = global.sessions[token];

        if (!session || session.user_role !== 'institution') {
            sendJSON(res, 401, { success: false, error: 'Invalid or expired session' });
            return;
        }

        if (!dbConnected || !pool) {
            sendJSON(res, 500, { success: false, error: 'Database not connected' });
            return;
        }

        const institutionId = session.user_id;

        // Get all courses for this institution with analytics
        const [courses] = await pool.query(
            `SELECT 
                id, 
                course_name as name, 
                category, 
                price, 
                mode,
                status,
                views,
                clicks,
                students,
                created_at
             FROM institution_hosted_courses 
             WHERE institution_id = ? AND is_active = TRUE 
             ORDER BY views DESC`,
            [institutionId]
        );

        // Prepare data for charts
        const courseNames = [];
        const studentCounts = [];
        const viewCounts = [];
        const categories = {};
        const topCourses = [];

        if (courses && courses.length > 0) {
            courses.forEach(course => {
                courseNames.push(course.name || 'Unnamed');
                studentCounts.push(course.students || 0);
                viewCounts.push(course.views || 0);

                // Category breakdown
                const cat = course.category || 'Uncategorized';
                if (!categories[cat]) categories[cat] = 0;
                categories[cat]++;

                // Top courses
                topCourses.push({
                    name: course.name,
                    category: course.category,
                    views: course.views || 0,
                    students: course.students || 0,
                    clicks: course.clicks || 0
                });
            });
        }

        // Sort top courses by views
        topCourses.sort((a, b) => b.views - a.views);

        // Generate monthly growth data (last 6 months)
        const months = [];
        const growthData = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            months.push(monthName);

            // Count students enrolled in this month (simplified)
            const [count] = await pool.query(
                `SELECT COUNT(*) as total FROM course_analytics 
                 WHERE MONTH(date) = ? AND YEAR(date) = ? AND course_id IN 
                 (SELECT id FROM institution_hosted_courses WHERE institution_id = ?)`,
                [d.getMonth() + 1, d.getFullYear(), institutionId]
            );
            growthData.push(count[0]?.total || Math.floor(Math.random() * 20) + 5);
        }

        // If no data, provide sample data for demo
        if (courses.length === 0) {
            // Sample data for empty state
            courseNames.push('No Data');
            studentCounts.push(0);
            viewCounts.push(0);
            categories['No Data'] = 1;
        }

        // Prepare response
        const response = {
            success: true,
            course_names: courseNames,
            student_counts: studentCounts,
            view_counts: viewCounts,
            categories: Object.keys(categories),
            category_counts: Object.values(categories),
            months: months.length > 0 ? months : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            growth_data: growthData.length > 0 ? growthData : [0, 0, 0, 0, 0, 0],
            top_courses: topCourses.slice(0, 5),
            total_courses: courses.length,
            total_students: courses.reduce((sum, c) => sum + (c.students || 0), 0),
            total_views: courses.reduce((sum, c) => sum + (c.views || 0), 0)
        };

        sendJSON(res, 200, response);

    } catch (error) {
        console.error('[Institution Analytics Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}



// ===== ADD INSTITUTION COURSE =====
// ===== ADD INSTITUTION COURSE =====
async function handleAddInstitutionCourse(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const token = data.token;

            if (!token) {
                sendJSON(res, 401, { success: false, error: 'No session token provided' });
                return;
            }

            global.sessions = global.sessions || {};
            const session = global.sessions[token];

            if (!session || session.user_role !== 'institution') {
                sendJSON(res, 401, { success: false, error: 'Invalid or expired session' });
                return;
            }

            if (!data.name || !data.category || data.price === undefined) {
                sendJSON(res, 400, { success: false, error: 'Course name, category, and price are required' });
                return;
            }

            if (dbConnected && pool) {
                const [result] = await pool.query(
                    `INSERT INTO institution_hosted_courses 
                     (institution_id, course_name, category, cost_per_year as price, period_years as duration, 
                      delivery_mode as mode, study_type as studyType, intake_date as intake, 
                      description, status, views, clicks, students, is_active) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 0, 0, TRUE)`,
                    [
                        session.user_id,
                        data.name.trim(),
                        data.category,
                        parseFloat(data.price) || 0,
                        parseFloat(data.duration) || 1,
                        data.mode || 'Online',
                        data.studyType || 'Full-time',
                        data.intake || 'Flexible',
                        data.description || '',
                        data.status || 'active'
                    ]
                );

                console.log('[Add Institution Course] ✅ Course added! ID:', result.insertId);

                sendJSON(res, 200, {
                    success: true,
                    message: 'Course added successfully!',
                    course_id: result.insertId
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Add Institution Course Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid request: ' + e.message });
        }
    });
}

// ===== TRACK COURSE ANALYTICS =====
async function handleTrackCourseAnalytics(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const { course_id, action } = data;
            
            if (!course_id || !action) {
                sendJSON(res, 400, { success: false, error: 'Course ID and action are required' });
                return;
            }

            if (!dbConnected || !pool) {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
                return;
            }

            const today = new Date().toISOString().split('T')[0];

            // Update course stats based on action
            let updateField = '';
            if (action === 'view') updateField = 'views = views + 1';
            else if (action === 'click') updateField = 'clicks = clicks + 1';
            else if (action === 'enroll') updateField = 'students = students + 1';
            else {
                sendJSON(res, 400, { success: false, error: 'Invalid action type' });
                return;
            }

            await pool.query(
                `UPDATE institution_hosted_courses SET ${updateField} WHERE id = ?`,
                [course_id]
            );

            // Also record in analytics table for daily tracking
            const [existing] = await pool.query(
                `SELECT id FROM course_analytics WHERE course_id = ? AND date = ?`,
                [course_id, today]
            );

            if (existing && existing.length > 0) {
                let analyticsUpdate = '';
                if (action === 'view') analyticsUpdate = 'views = views + 1';
                else if (action === 'click') analyticsUpdate = 'clicks = clicks + 1';
                else if (action === 'enroll') analyticsUpdate = 'enrollments = enrollments + 1';

                await pool.query(
                    `UPDATE course_analytics SET ${analyticsUpdate} WHERE id = ?`,
                    [existing[0].id]
                );
            } else {
                let count = 0;
                if (action === 'view') count = 1;
                else if (action === 'click') count = 1;
                else if (action === 'enroll') count = 1;

                await pool.query(
                    `INSERT INTO course_analytics (course_id, date, views, clicks, enrollments) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [course_id, today, action === 'view' ? 1 : 0, action === 'click' ? 1 : 0, action === 'enroll' ? 1 : 0]
                );
            }

            sendJSON(res, 200, { success: true, message: 'Analytics tracked successfully' });

        } catch (e) {
            console.error('[Track Course Analytics Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid request: ' + e.message });
        }
    });
}

// ===== DELETE INSTITUTION COURSE =====
async function handleDeleteInstitutionCourse(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            const token = data.token;
            const courseId = req.url.split('/').pop();

            if (!token) {
                sendJSON(res, 401, { success: false, error: 'No session token provided' });
                return;
            }

            global.sessions = global.sessions || {};
            const session = global.sessions[token];

            if (!session || session.user_role !== 'institution') {
                sendJSON(res, 401, { success: false, error: 'Invalid or expired session' });
                return;
            }

            if (dbConnected && pool) {
                const [check] = await pool.query(
                    'SELECT id FROM institution_hosted_courses WHERE id = ? AND institution_id = ?',
                    [courseId, session.user_id]
                );

                if (!check || check.length === 0) {
                    sendJSON(res, 404, { success: false, error: 'Course not found or not owned by this institution' });
                    return;
                }

                await pool.query(
                    'UPDATE institution_hosted_courses SET is_active = FALSE WHERE id = ?',
                    [courseId]
                );

                console.log('[Delete Institution Course] ✅ Course deleted! ID:', courseId);

                sendJSON(res, 200, {
                    success: true,
                    message: 'Course deleted successfully!'
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Delete Institution Course Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid request: ' + e.message });
        }
    });
}

// ==============================================
// ADVERTISER API HANDLERS
// ==============================================

// ===== GENERATE ACCESS CODE =====
async function handleGenerateAccessCode(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Generate Access Code] Received:', data);

            const email = data.email || '';
            
            // Generate a unique access code (6 characters)
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let accessCode = '';
            for (let i = 0; i < 6; i++) {
                accessCode += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            
            if (dbConnected && pool) {
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                
                // Check if code already exists
                const [existing] = await pool.query(
                    'SELECT id FROM advertiser_access_codes WHERE access_code = ?',
                    [accessCode]
                );
                
                // If code exists, generate a new one
                if (existing && existing.length > 0) {
                    for (let i = 0; i < 10; i++) {
                        let newCode = '';
                        for (let j = 0; j < 6; j++) {
                            newCode += characters.charAt(Math.floor(Math.random() * characters.length));
                        }
                        const [check] = await pool.query(
                            'SELECT id FROM advertiser_access_codes WHERE access_code = ?',
                            [newCode]
                        );
                        if (!check || check.length === 0) {
                            accessCode = newCode;
                            break;
                        }
                    }
                }
                
                const [result] = await pool.query(
                    `INSERT INTO advertiser_access_codes 
                     (access_code, email, expires_at, is_active) 
                     VALUES (?, ?, ?, TRUE)`,
                    [accessCode, email, expiresAt]
                );
                
                console.log('[Generate Access Code] ✅ Code generated:', accessCode);
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Access code generated successfully',
                    access_code: accessCode,
                    expires_at: expiresAt
                });
            } else {
                // Fallback for testing without database
                const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
                sendJSON(res, 200, {
                    success: true,
                    message: 'Access code generated (fallback)',
                    access_code: fallbackCode,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
                });
            }
        } catch (e) {
            console.error('[Generate Access Code Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid request: ' + e.message });
        }
    });
}

// ===== VERIFY ACCESS CODE =====
async function handleVerifyAccessCode(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Verify Access Code] Received:', data);

            const { access_code, email } = data;
            
            if (!access_code) {
                sendJSON(res, 400, { success: false, error: 'Access code is required' });
                return;
            }
            
            if (dbConnected && pool) {
                // Check if code exists and is active
                const [rows] = await pool.query(
                    `SELECT * FROM advertiser_access_codes 
                     WHERE access_code = ? AND is_active = TRUE 
                     AND (expires_at IS NULL OR expires_at > NOW())`,
                    [access_code]
                );
                
                if (rows && rows.length > 0) {
                    // Update email if provided
                    if (email) {
                        await pool.query(
                            `UPDATE advertiser_access_codes SET email = ? WHERE access_code = ?`,
                            [email, access_code]
                        );
                    }
                    
                    console.log('[Verify Access Code] ✅ Code verified:', access_code);
                    
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Access code verified successfully',
                        access_code: access_code,
                        verified: true
                    });
                } else {
                    sendJSON(res, 401, {
                        success: false,
                        error: 'Invalid or expired access code',
                        verified: false
                    });
                }
            } else {
                // Fallback for testing - accept any 6-digit code
                if (access_code.length === 6) {
                    sendJSON(res, 200, {
                        success: true,
                        message: 'Access code verified (fallback)',
                        verified: true
                    });
                } else {
                    sendJSON(res, 401, {
                        success: false,
                        error: 'Invalid access code',
                        verified: false
                    });
                }
            }
        } catch (e) {
            console.error('[Verify Access Code Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid request: ' + e.message });
        }
    });
}

// ===== SUBMIT CAMPAIGN REQUEST =====
async function handleSubmitCampaign(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Submit Campaign] Received:', data);

            const {
                advertiserName,
                advertiserEmail,
                advertiserPhone,
                businessName,
                industry,
                adFormat,
                budget,
                duration,
                targetAudience,
                message,
                accessCode
            } = data;
            
            // Validate required fields
            if (!advertiserName || !advertiserEmail || !adFormat || !budget || !duration) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Name, email, ad format, budget, and duration are required' 
                });
                return;
            }
            
            // Validate access code
            if (accessCode) {
                const [codeCheck] = await pool.query(
                    `SELECT * FROM advertiser_access_codes 
                     WHERE access_code = ? AND is_active = TRUE 
                     AND (expires_at IS NULL OR expires_at > NOW())`,
                    [accessCode]
                );
                
                if (!codeCheck || codeCheck.length === 0) {
                    sendJSON(res, 401, {
                        success: false,
                        error: 'Invalid or expired access code. Please generate a new one.'
                    });
                    return;
                }
            }
            
            if (dbConnected && pool) {
                // Generate unique campaign ID
                const campaignId = 'CAM' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
                
                const [result] = await pool.query(
                    `INSERT INTO advertiser_campaigns 
                     (campaign_id, advertiser_name, advertiser_email, advertiser_phone, 
                      business_name, industry, ad_format, budget, duration_days, 
                      target_audience, message, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                    [
                        campaignId,
                        advertiserName.trim(),
                        advertiserEmail.trim().toLowerCase(),
                        advertiserPhone || '',
                        businessName || '',
                        industry || '',
                        adFormat,
                        parseFloat(budget) || 0,
                        parseInt(duration) || 7,
                        targetAudience || '',
                        message || ''
                    ]
                );
                
                console.log('[Submit Campaign] ✅ Campaign submitted! ID:', result.insertId);
                
                // Try to send confirmation email
                try {
                    const emailSubject = 'Your Campaign Request - Lanvai ADExchange';
                    const emailHtml = `
                        <h2>Campaign Request Received</h2>
                        <p>Dear ${advertiserName},</p>
                        <p>Your campaign request has been received and is being reviewed.</p>
                        <p><strong>Campaign ID:</strong> ${campaignId}</p>
                        <p><strong>Ad Format:</strong> ${adFormat}</p>
                        <p><strong>Budget:</strong> $${parseFloat(budget).toFixed(2)}</p>
                        <p><strong>Duration:</strong> ${duration} days</p>
                        <p>We will connect you with ad owners shortly.</p>
                        <p>Thank you for choosing Lanvai ADExchange!</p>
                    `;
                    await sendEmailReply(advertiserEmail, emailSubject, emailHtml, `Campaign Request Received\n\nDear ${advertiserName},\n\nYour campaign request has been received and is being reviewed.\n\nCampaign ID: ${campaignId}\nAd Format: ${adFormat}\nBudget: $${parseFloat(budget).toFixed(2)}\nDuration: ${duration} days\n\nWe will connect you with ad owners shortly.`);
                } catch (emailError) {
                    console.log('Email not sent:', emailError.message);
                }
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Campaign submitted successfully!',
                    campaign_id: campaignId,
                    status: 'pending'
                });
            } else {
                // Fallback for testing
                sendJSON(res, 200, {
                    success: true,
                    message: 'Campaign submitted (fallback)',
                    campaign_id: 'CAM-FALLBACK-' + Date.now()
                });
            }
        } catch (e) {
            console.error('[Submit Campaign Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid request: ' + e.message });
        }
    });
}

// ===== GET CAMPAIGNS =====
async function handleGetCampaigns(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const email = params.email;
        const status = params.status;
        const limit = parseInt(params.limit) || 50;
        
        console.log('[Get Campaigns] Fetching for email:', email);
        
        if (dbConnected && pool) {
            let sql = 'SELECT * FROM advertiser_campaigns';
            let queryParams = [];
            let conditions = [];
            
            if (email) {
                conditions.push('advertiser_email = ?');
                queryParams.push(email.trim().toLowerCase());
            }
            
            if (status && status !== 'all') {
                conditions.push('status = ?');
                queryParams.push(status);
            }
            
            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }
            
            sql += ' ORDER BY created_at DESC LIMIT ?';
            queryParams.push(limit);
            
            const [rows] = await pool.query(sql, queryParams);
            
            console.log('[Get Campaigns] Found', rows.length, 'campaigns');
            
            // Get stats
            const [stats] = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(impressions) as total_impressions,
                    SUM(clicks) as total_clicks
                 FROM advertiser_campaigns
                 ${email ? 'WHERE advertiser_email = ?' : ''}`,
                email ? [email.trim().toLowerCase()] : []
            );
            
            sendJSON(res, 200, {
                success: true,
                campaigns: rows || [],
                stats: stats[0] || { total: 0, active: 0, pending: 0, completed: 0, total_impressions: 0, total_clicks: 0 },
                count: rows ? rows.length : 0
            });
        } else {
            sendJSON(res, 500, { success: false, error: 'Database not connected' });
        }
    } catch (error) {
        console.error('[Get Campaigns Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ===== UPDATE CAMPAIGN STATUS =====
async function handleUpdateCampaign(req, res) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', async function() {
        try {
            const data = JSON.parse(body);
            console.log('[Update Campaign] Received:', data);
            
            const { campaign_id, status, impressions, clicks, response, adminName } = data;
            
            if (!campaign_id) {
                sendJSON(res, 400, { success: false, error: 'Campaign ID is required' });
                return;
            }
            
            if (dbConnected && pool) {
                let updates = [];
                let params = [];
                
                if (status) {
                    updates.push('status = ?');
                    params.push(status);
                }
                if (impressions !== undefined) {
                    updates.push('impressions = ?');
                    params.push(impressions);
                }
                if (clicks !== undefined) {
                    updates.push('clicks = ?');
                    params.push(clicks);
                }
                // IMPORTANT: Add response field handling
                if (response !== undefined) {
                    updates.push('response = ?');
                    params.push(response);
                }
                if (adminName !== undefined) {
                    updates.push('admin_name = ?');
                    params.push(adminName);
                }
                
                // If status is 'responded', add responded_at timestamp
                if (status === 'responded' || response) {
                    updates.push('responded_at = NOW()');
                }
                
                if (updates.length === 0) {
                    sendJSON(res, 400, { success: false, error: 'No fields to update' });
                    return;
                }
                
                params.push(campaign_id);
                const [result] = await pool.query(
                    `UPDATE advertiser_campaigns SET ${updates.join(', ')} WHERE id = ?`,
                    params
                );
                
                console.log('[Update Campaign] ✅ Updated campaign:', campaign_id);
                console.log('[Update Campaign] Updated fields:', updates.join(', '));
                console.log('[Update Campaign] Affected rows:', result.affectedRows);
                
                // Try to send email notification
                try {
                    // Get campaign details for email
                    const [campaignRows] = await pool.query(
                        'SELECT * FROM advertiser_campaigns WHERE id = ?',
                        [campaign_id]
                    );
                    
                    if (campaignRows && campaignRows.length > 0 && response) {
                        const campaign = campaignRows[0];
                        const emailSubject = `Response to your Campaign Request - ${campaign.ad_format}`;
                        const emailHtml = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <title>Response from Lanvai AdExchange</title>
                                <style>
                                    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                                    .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #fbbf24; }
                                    .header h1 { color: #1e3a5f; font-size: 24px; }
                                    .content { padding: 20px 0; color: #333; line-height: 1.6; }
                                    .message-box { background: #fef3c7; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #fbbf24; margin: 15px 0; }
                                    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>📢 Lanvai AdExchange</h1>
                                        <p style="color: #64748b;">Response to Your Campaign Inquiry</p>
                                    </div>
                                    <div class="content">
                                        <p>Dear <strong>${campaign.advertiser_name}</strong>,</p>
                                        <p>Thank you for your interest in Lanvai AdExchange. We have reviewed your campaign request.</p>
                                        <div class="message-box">
                                            <p>${response}</p>
                                        </div>
                                        <p>If you have any further questions, feel free to reply to this email or contact us at support@lanvai.com.</p>
                                        <p style="margin-top: 20px;">
                                            Best regards,<br>
                                            <strong>${adminName || 'Lanvai AdExchange Team'}</strong><br>
                                            Lanvai AdExchange
                                        </p>
                                    </div>
                                    <div class="footer">
                                        <p>&copy; 2025 Lanvai | Smart Advertising Solutions</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `;
                        const emailText = `Dear ${campaign.advertiser_name},\n\nThank you for your interest in Lanvai AdExchange. We have reviewed your campaign request.\n\n${response}\n\nIf you have any further questions, feel free to reply to this email or contact us at support@lanvai.com.\n\nBest regards,\n${adminName || 'Lanvai AdExchange Team'}\nLanvai AdExchange`;
                        await sendEmailReply(campaign.advertiser_email, emailSubject, emailHtml, emailText);
                    }
                } catch (emailError) {
                    console.log('[Update Campaign] Email not sent:', emailError.message);
                }
                
                sendJSON(res, 200, {
                    success: true,
                    message: 'Campaign updated successfully',
                    affected_rows: result.affectedRows
                });
            } else {
                sendJSON(res, 500, { success: false, error: 'Database not connected' });
            }
        } catch (e) {
            console.error('[Update Campaign Error]', e);
            sendJSON(res, 400, { success: false, error: 'Invalid request: ' + e.message });
        }
    });
}
// ===== GET CAMPAIGN STATS =====
async function handleGetCampaignStats(req, res) {
    try {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        const email = params.email;
        
        console.log('[Get Campaign Stats] Fetching for email:', email);
        
        if (dbConnected && pool) {
            let sql = `SELECT 
                COUNT(*) as total_campaigns,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_campaigns,
                SUM(impressions) as total_impressions,
                SUM(clicks) as total_clicks,
                AVG(budget) as avg_budget
            FROM advertiser_campaigns`;
            let queryParams = [];
            
            if (email) {
                sql += ' WHERE advertiser_email = ?';
                queryParams.push(email.trim().toLowerCase());
            }
            
            const [stats] = await pool.query(sql, queryParams);
            
            sendJSON(res, 200, {
                success: true,
                stats: stats[0] || { 
                    total_campaigns: 0, 
                    active_campaigns: 0, 
                    pending_campaigns: 0,
                    total_impressions: 0,
                    total_clicks: 0,
                    avg_budget: 0
                }
            });
        } else {
            sendJSON(res, 500, { success: false, error: 'Database not connected' });
        }
    } catch (error) {
        console.error('[Get Campaign Stats Error]', error);
        sendJSON(res, 500, { success: false, error: error.message });
    }
}

// ========== API HANDLERS ==========

function handleAPI(req, res) {
    const pathname = req.url.split('?')[0];
    const method = req.method;

    if (!pathname.includes('.ico') && !pathname.includes('.png') && !pathname.includes('.jpg') && !pathname.includes('.css')) {
        console.log('[API]', method, pathname);
    }

    if (method === 'OPTIONS') {
        sendOptions(res);
        return;
    }

    // ===== GET: Health Check =====
    if (pathname === '/api/health' && method === 'GET') {
        sendJSON(res, 200, { 
            status: 'OK', 
            database: dbConnected ? 'connected' : 'disconnected',
            email: emailEnabled ? 'enabled' : 'disabled',
            timestamp: new Date().toISOString() 
        });
        return;
    }

    // ==============================================
    // ===== AUTH ROUTES =====
    // ==============================================
    
    if (pathname === '/api/auth/signup' && method === 'POST') {
        handleSignup(req, res);
        return;
    }

    if (pathname === '/api/auth/verify' && method === 'POST') {
        handleVerifyCode(req, res);
        return;
    }

    if (pathname === '/api/auth/resend' && method === 'POST') {
        handleResendCode(req, res);
        return;
    }

    if (pathname === '/api/auth/signin' && method === 'POST') {
        handleSignin(req, res);
        return;
    }

    if (pathname === '/api/auth/session' && method === 'GET') {
        handleCheckSession(req, res);
        return;
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
        handleLogout(req, res);
        return;
    }

    // ==============================================
    // ===== INSTITUTION ROUTES =====
    // ==============================================

    if (pathname === '/api/institution/signup' && method === 'POST') {
        handleInstitutionSignup(req, res);
        return;
    }

    if (pathname === '/api/institution/signin' && method === 'POST') {
        handleInstitutionSignin(req, res);
        return;
    }

    if (pathname === '/api/institution/status' && method === 'GET') {
        handleInstitutionStatus(req, res);
        return;
    }

    // ==============================================
    // ===== COURSE INQUIRY ROUTES (EDULINK) =====
    // ==============================================
    
    if (pathname === '/api/inquiries/submit' && method === 'POST') {
        handleSubmitInquiry(req, res);
        return;
    }

    if (pathname === '/api/inquiries' && method === 'GET') {
        handleGetInquiries(req, res);
        return;
    }

    if (pathname === '/api/inquiries/update' && method === 'PUT') {
        handleUpdateInquiry(req, res);
        return;
    }

    // ==============================================
    // ===== LANVAI INQUIRY ROUTES =====
    // ==============================================
    
    if (pathname === '/api/lanvai/inquiries/submit' && method === 'POST') {
        handleSubmitLanvaiInquiry(req, res);
        return;
    }

    if (pathname === '/api/lanvai/inquiries' && method === 'GET') {
        handleGetLanvaiInquiries(req, res);
        return;
    }

    if (pathname === '/api/lanvai/inquiries/update' && method === 'PUT') {
        handleUpdateLanvaiInquiry(req, res);
        return;
    }

    // ==============================================
    // ===== QUOTE ROUTES =====
    // ==============================================

    // Submit quote request
    if (pathname === '/api/quote/submit' && method === 'POST') {
        handleSubmitQuote(req, res);
        return;
    }

    // Get all quotes (Admin)
    if (pathname === '/api/quotes' && method === 'GET') {
        handleGetQuotes(req, res);
        return;
    }

    // Update quote (Admin)
    if (pathname === '/api/quotes/update' && method === 'PUT') {
        handleUpdateQuote(req, res);
        return;
    }

    // ==============================================
    // ===== PAYMENT ROUTES (INTASEND) =====
    // ==============================================
    
    // M-Pesa STK Push via IntaSend
    if (pathname === '/api/payment/mpesa' && method === 'POST') {
        handleIntasendStkPush(req, res);
        return;
    }

    // IntaSend Webhook
    if (pathname === '/api/payment/intasend-webhook' && method === 'POST') {
        handleIntasendWebhook(req, res);
        return;
    }

    // Payment Status Check
    if (pathname === '/api/payment/status' && method === 'GET') {
        handleIntasendStatus(req, res);
        return;
    }

    // Card Payment via IntaSend
    if (pathname === '/api/payment/card' && method === 'POST') {
        handleIntasendCardPayment(req, res);
        return;
    }

    // Bank Transfer
    if (pathname === '/api/payment/bank' && method === 'POST') {
        handleBankPayment(req, res);
        return;
    }

    // Confirm Bank Payment (Admin)
    if (pathname === '/api/payment/confirm-bank' && method === 'POST') {
        handleConfirmBankPayment(req, res);
        return;
    }

    // Wallet Balance
    if (pathname === '/api/wallet/balance' && method === 'GET') {
        handleGetWalletBalance(req, res);
        return;
    }

    // Payment History
    if (pathname === '/api/payment/history' && method === 'GET') {
        handleGetPaymentHistory(req, res);
        return;
    }

    // Admin Payments
    if (pathname === '/api/admin/payments' && method === 'GET') {
        handleGetAllPayments(req, res);
        return;
    }

    // ==============================================
// ===== ADMIN SERVICE MANAGEMENT =====
// ==============================================

// ADD Service
if (pathname === '/api/admin/services' && method === 'POST') {
    handleAddService(req, res);
    return;
}

// UPDATE Service
if (pathname === '/api/admin/services' && method === 'PUT') {
    handleUpdateService(req, res);
    return;
}

// DELETE Service
if (pathname === '/api/admin/services' && method === 'DELETE') {
    handleDeleteService(req, res);
    return;
}

// ==============================================
// ===== FORGOT PASSWORD / RESET PASSWORD =====
// ==============================================

// Forgot password - send reset link
if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    handleForgotPassword(req, res);
    return;
}

// Reset password - update with code
if (pathname === '/api/auth/reset-password' && method === 'POST') {
    handleResetPassword(req, res);
    return;
}

// Verify reset code (GET)
if (pathname === '/api/auth/verify-reset-code' && method === 'GET') {
    handleVerifyResetCode(req, res);
    return;
}// ==============================================
// ===== INSTITUTION ANALYTICS ROUTES =====
// ==============================================

// Get institution analytics
if (pathname === '/api/institution/analytics' && method === 'GET') {
    handleInstitutionAnalytics(req, res);
    return;
}

// Track course analytics (view, click, enroll)
if (pathname === '/api/institution/track-analytics' && method === 'POST') {
    handleTrackCourseAnalytics(req, res);
    return;
}

// Get institution courses (updated)
if (pathname === '/api/institution/courses' && method === 'GET') {
    handleGetInstitutionCourses(req, res);
    return;
}

// ===== AD EXCHANGE ROUTES =====

// Submit Ad Exchange inquiry
if (pathname === '/api/adexchange/submit' && method === 'POST') {
    handleAdExchangeSubmit(req, res);
    return;
}

// Get Ad Exchange inquiries
if (pathname === '/api/adexchange/inquiries' && method === 'GET') {
    handleGetAdExchangeInquiries(req, res);
    return;
}

// Update Ad Exchange inquiry (handles both AdOwner and Advertiser)

if (pathname === '/api/adexchange/inquiries/update' && method === 'PUT') {
    handleUpdateAdExchangeInquiry(req, res);
    return;
}

    // ==============================================
    // ===== MEDIA ROUTES =====
    // ==============================================
    
    if (pathname === '/api/media/news' && method === 'GET') {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        
        if (params.id) {
            handleGetSingleNews(req, res);
        } else {
            handleGetNews(req, res);
        }
        return;
    }

    if (pathname === '/api/media/insights' && method === 'GET') {
        const urlParts = req.url.split('?');
        const params = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
        
        if (params.id) {
            handleGetSingleInsight(req, res);
        } else {
            handleGetInsights(req, res);
        }
        return;
    }

    if (pathname === '/api/media/news' && method === 'POST') {
        handleCreateNews(req, res);
        return;
    }

    if (pathname === '/api/media/insights' && method === 'POST') {
        handleCreateInsight(req, res);
        return;
    }

    if (pathname === '/api/media/news' && method === 'PUT') {
        handleUpdateNews(req, res);
        return;
    }

    if (pathname === '/api/media/insights' && method === 'PUT') {
        handleUpdateInsight(req, res);
        return;
    }

    if (pathname === '/api/media/news' && method === 'DELETE') {
        handleDeleteNews(req, res);
        return;
    }

    if (pathname === '/api/media/insights' && method === 'DELETE') {
        handleDeleteInsight(req, res);
        return;
    }

    // ==============================================
    // ===== MEDIA ADMIN ROUTES =====
    // ==============================================
    
    if (pathname === '/api/admin/media/news' && method === 'POST') {
        handleAdminCreateNews(req, res);
        return;
    }

    if (pathname === '/api/admin/media/insights' && method === 'POST') {
        handleAdminCreateInsight(req, res);
        return;
    }

    if (pathname === '/api/admin/media/news' && method === 'PUT') {
        handleAdminUpdateNews(req, res);
        return;
    }

    if (pathname === '/api/admin/media/insights' && method === 'PUT') {
        handleAdminUpdateInsight(req, res);
        return;
    }

    if (pathname === '/api/admin/media/news' && method === 'DELETE') {
        handleAdminDeleteNews(req, res);
        return;
    }

    if (pathname === '/api/admin/media/insights' && method === 'DELETE') {
        handleAdminDeleteInsight(req, res);
        return;
    }

    // ==============================================
    // ===== ANALYTICS ROUTES =====
    // ==============================================
    
    if (pathname === '/api/track/pageview' && method === 'POST') {
        handleTrackPageView(req, res);
        return;
    }

    if (pathname === '/api/track/click' && method === 'POST') {
        handleTrackClick(req, res);
        return;
    }

    if (pathname === '/api/track/formsubmit' && method === 'POST') {
        handleTrackFormSubmit(req, res);
        return;
    }

    if (pathname === '/api/analytics' && method === 'GET') {
        handleGetAnalytics(req, res);
        return;
    }

    if (pathname === '/api/admin/login' && method === 'POST') {
        handleAdminLogin(req, res);
        return;
    }

    // ==============================================
    // ===== INSTITUTION COURSE ROUTES =====
    // ==============================================

    if (pathname === '/api/institution/courses' && method === 'GET') {
        handleGetInstitutionCourses(req, res);
        return;
    }

    if (pathname === '/api/institution/courses' && method === 'POST') {
        handleAddInstitutionCourse(req, res);
        return;
    }

    if (pathname.startsWith('/api/institution/courses/') && method === 'DELETE') {
        handleDeleteInstitutionCourse(req, res);
        return;
    }

    // ==============================================
    // ===== ADVERTISER ROUTES =====
    // ==============================================

    if (pathname === '/api/advertiser/request-code' && method === 'POST') {
        handleGenerateAccessCode(req, res);
        return;
    }

    if (pathname === '/api/advertiser/verify-code' && method === 'POST') {
        handleVerifyAccessCode(req, res);
        return;
    }

    if (pathname === '/api/advertiser/campaign' && method === 'POST') {
        handleSubmitCampaign(req, res);
        return;
    }

    if (pathname === '/api/advertiser/campaigns' && method === 'GET') {
        handleGetCampaigns(req, res);
        return;
    }

    if (pathname === '/api/advertiser/campaign/update' && method === 'PUT') {
        handleUpdateCampaign(req, res);
        return;
    }

    if (pathname === '/api/advertiser/stats' && method === 'GET') {
        handleGetCampaignStats(req, res);
        return;
    }

    // ==============================================
    // ===== LIBRARY ROUTES =====
    // ==============================================
    
    if (pathname === '/api/library/books' && method === 'GET') {
        handleGetBooks(req, res);
        return;
    }

    if (pathname === '/api/library/categories' && method === 'GET') {
        handleGetCategories(req, res);
        return;
    }

    if (pathname === '/api/library/submit' && method === 'POST') {
        handleBookSubmission(req, res);
        return;
    }

    if (pathname === '/api/library/submissions' && method === 'GET') {
        handleGetSubmissions(req, res);
        return;
    }

    // ==============================================
    // ===== OTHER ROUTES =====
    // ==============================================
    
    if (pathname === '/api/courses' && method === 'GET') {
        handleCourses(req, res);
        return;
    }

    if (pathname === '/api/expert-services' && method === 'GET') {
        handleExpertServices(req, res);
        return;
    }

    if (pathname === '/api/ad-packages' && method === 'GET') {
        handleAdPackages(req, res);
        return;
    }

    if (pathname === '/api/branches' && method === 'GET') {
        handleBranches(req, res);
        return;
    }

    if (pathname === '/api/media-submit' && method === 'POST') {
        handleMediaSubmit(req, res);
        return;
    }

    if (pathname === '/api/expert-submit' && method === 'POST') {
        handleExpertSubmit(req, res);
        return;
    }

    if (pathname === '/api/ad-category-select' && method === 'POST') {
        handleAdCategorySelect(req, res);
        return;
    }

    if (pathname === '/api/institution-hosted' && method === 'POST') {
        handleInstitutionHosted(req, res);
        return;
    }

   

    if (pathname === '/api/cookie-consent' && method === 'POST') {
        handleCookieConsent(req, res);
        return;
    }

    if (pathname === '/api/cookie-consent' && method === 'GET') {
        handleGetCookieConsent(req, res);
        return;
    }

    if (pathname === '/api/track' && method === 'POST') {
        handleTrack(req, res);
        return;
    }

    // ==============================================
    // IMAGE HANDLER
    // ==============================================

    // Handle image requests
    if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
        const possiblePaths = [
            path.join(PUBLIC_DIR, pathname),
            path.join(PUBLIC_DIR, 'images', path.basename(pathname)),
            path.join(PUBLIC_DIR, '..', 'files', path.basename(pathname)),
            path.join(__dirname, '..', 'files', path.basename(pathname))
        ];
        
        let found = false;
        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                serveFileWithFallback(res, filePath);
                found = true;
                break;
            }
        }
        
        if (!found) {
            const ext = path.extname(pathname);
            if (ext === '.png') {
                const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
                res.writeHead(200, { 'Content-Type': 'image/png' });
                res.end(pngData);
            } else if (ext === '.svg') {
                const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="#fbbf24"/>
                    <text x="30" y="68" font-size="48" font-weight="bold" fill="#1a142b">L</text>
                </svg>`;
                res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
                res.end(svgData);
            } else {
                res.writeHead(404);
                res.end();
            }
        }
        return;
    }

    // ===== 404 - Not Found =====
    console.log('[API 404]', pathname);
    sendJSON(res, 404, { error: 'API endpoint not found: ' + pathname });
}

// ========== FILE SERVER ==========

function serveFileWithFallback(res, filePath) {
    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp'
    }[ext] || 'text/plain';

    fs.readFile(filePath, function(err, data) {
        if (err) {
            if (!filePath.includes('favicon.ico') && !filePath.includes('.png') && !filePath.includes('.jpg')) {
                console.log('[File Not Found]', filePath);
            }
            const indexFile = path.join(PUBLIC_DIR, 'index.html');
            fs.readFile(indexFile, function(err2, data2) {
                if (err2) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('404 - File Not Found: ' + filePath);
                    return;
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(data2);
            });
            return;
        }
        if (ext === '.html' || ext === '.js' || ext === '.css') {
            console.log('[Serving]', filePath);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.end(data);
    });
}

// ========== CREATE SERVER ==========

const server = http.createServer(function(req, res) {
    const pathname = req.url.split('?')[0];
    
    if (!pathname.includes('.ico') && !pathname.includes('.png') && !pathname.includes('.jpg') && !pathname.includes('.css') && !pathname.includes('.js')) {
        console.log('[Request]', req.method, pathname);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (pathname.indexOf('/api/') === 0) {
        handleAPI(req, res);
        return;
    }

    let filePath = path.join(PUBLIC_DIR, pathname);
    
    if (pathname === '/' || pathname === '') {
        filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    serveFileWithFallback(res, filePath);
});

// ========== START SERVER ==========

async function startServer() {
    // Setup email transporter
    setupEmailTransporter();
    
    // Initialize database
    await initDatabase();

    server.listen(PORT, function() {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 Lanvai Server Started Successfully!');
        console.log('='.repeat(60));
        console.log('📁 Serving files from:', PUBLIC_DIR);
        console.log('📡 Server running on: http://localhost:' + PORT);
        console.log('📡 API Base URL: http://localhost:' + PORT + '/api/');
        console.log('📡 Health Check: http://localhost:' + PORT + '/api/health');
        console.log('📡 Test Courses: http://localhost:' + PORT + '/api/courses');
        console.log('📡 Library Books: http://localhost:' + PORT + '/api/library/books');
        console.log('📡 Analytics: http://localhost:' + PORT + '/api/analytics');
        console.log('📡 EDULINK Inquiries: http://localhost:' + PORT + '/api/inquiries');
        console.log('📡 Lanvai Inquiries: http://localhost:' + PORT + '/api/lanvai/inquiries');
        console.log('📡 Media News: http://localhost:' + PORT + '/api/media/news');
        console.log('📡 Media Insights: http://localhost:' + PORT + '/api/media/insights');
        console.log('📡 Wallet: http://localhost:' + PORT + '/api/wallet/balance');
        console.log('📡 Payments: http://localhost:' + PORT + '/api/payment/history');
        console.log('💾 Database: ' + (dbConnected ? '✅ Connected' : '⚠️ Using in-memory storage'));
        console.log('📧 Email Service: ' + (emailEnabled ? '✅ Enabled' : '⚠️ Disabled - Please configure .env'));
        console.log('\n📊 Data is stored in ' + (dbConnected ? 'MySQL database' : 'memory (fallback)'));
        console.log('\n🌐 Open your browser and navigate to:');
        console.log('   http://localhost:' + PORT + '/');
        console.log('   http://localhost:' + PORT + '/courses.html');
        console.log('   http://localhost:' + PORT + '/students.html');
        console.log('   http://localhost:' + PORT + '/library.html');
        console.log('   http://localhost:' + PORT + '/admin.html');
        console.log('   http://localhost:' + PORT + '/admin/inquiries.html');
        console.log('   http://localhost:' + PORT + '/media.html');
        console.log('   http://localhost:' + PORT + '/experts.html');
        console.log('   http://localhost:' + PORT + '/adexchange.html');
        console.log('   http://localhost:' + PORT + '/institutionhosted.html');
        console.log('   http://localhost:' + PORT + '/lanvaihosted.html');
        console.log('   http://localhost:' + PORT + '/contact.html');
        console.log('   http://localhost:' + PORT + '/wallet.html');
        console.log('='.repeat(60));
        console.log('✅ Server is ready! Press Ctrl+C to stop.\n');
    });
}

startServer().catch(console.error);

process.on('SIGINT', function() {
    console.log('\n👋 Server shutting down...');
    if (pool) {
        pool.end().then(function() {
            process.exit(0);
        }).catch(function() {
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});