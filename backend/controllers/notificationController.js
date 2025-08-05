/**
 * Sends a notification to a specific user by inserting it into the notifications table.
 * @param {string} email .
 * @param {string} message 
 * @param {object} sql The database connection object.
 */
export const sendNotification = async (email, message, sql) => {
    try {
        await sql`
            INSERT INTO notifications (user_email, notification_text)
            VALUES (${email}, ${message})
        `;
    } catch (error) {
        console.error("Error sending notification:", error);
        // We will not throw an error here to avoid blocking other operations
        // if the notification fails.
    }
};
