const knowledgeBase = {
    "Network": {
        title: "Network Connectivity Troubleshooting",
        steps: [
            "Check whether WiFi is enabled.",
            "Restart the network adapter.",
            "Forget and reconnect to the office WiFi.",
            "Restart the computer.",
            "Check whether other employees are experiencing the same issue."
        ]
    },

    "Access & Identity": {
        title: "Account and Access Troubleshooting",
        steps: [
            "Verify the username.",
            "Check whether the account is locked.",
            "Reset the password if required.",
            "Verify that the user has the required application permissions.",
            "Contact IT administration if access is still unavailable."
        ]
    },

    "Hardware": {
        title: "Hardware Troubleshooting",
        steps: [
            "Check all physical connections.",
            "Restart the device.",
            "Check whether the device appears in system settings.",
            "Try a known working peripheral if available.",
            "Escalate to IT support if hardware failure is suspected."
        ]
    },

    "Software": {
        title: "Software Troubleshooting",
        steps: [
            "Restart the application.",
            "Check for available updates.",
            "Clear application cache if applicable.",
            "Restart the computer.",
            "Reinstall the application if the problem continues."
        ]
    },

    "Email": {
        title: "Email Troubleshooting",
        steps: [
            "Check the internet connection.",
            "Restart the email application.",
            "Verify mailbox credentials.",
            "Check mailbox storage limits.",
            "Contact IT support if the mail server is unavailable."
        ]
    },

    "General IT": {
        title: "General IT Troubleshooting",
        steps: [
            "Restart the affected application or device.",
            "Check the network connection.",
            "Record any error message.",
            "Retry the operation.",
            "Contact IT support if the issue persists."
        ]
    }
};

function knowledgeAgent(category) {
    return knowledgeBase[category] || knowledgeBase["General IT"];
}

module.exports = knowledgeAgent;