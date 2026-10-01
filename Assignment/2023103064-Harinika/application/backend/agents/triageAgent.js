function triageAgent(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    let category = "General IT";
    let priority = "Medium";

    // Category detection
    if (
        text.includes("wifi") ||
        text.includes("internet") ||
        text.includes("network") ||
        text.includes("vpn") ||
        text.includes("connection")
    ) {
        category = "Network";
    } else if (
        text.includes("password") ||
        text.includes("login") ||
        text.includes("account") ||
        text.includes("access")
    ) {
        category = "Access & Identity";
    } else if (
        text.includes("laptop") ||
        text.includes("keyboard") ||
        text.includes("mouse") ||
        text.includes("printer") ||
        text.includes("monitor")
    ) {
        category = "Hardware";
    } else if (
        text.includes("software") ||
        text.includes("application") ||
        text.includes("app") ||
        text.includes("error") ||
        text.includes("crash")
    ) {
        category = "Software";
    } else if (
        text.includes("email") ||
        text.includes("outlook") ||
        text.includes("mail")
    ) {
        category = "Email";
    }

    // Priority detection
    if (
        text.includes("urgent") ||
        text.includes("critical") ||
        text.includes("down") ||
        text.includes("cannot work") ||
        text.includes("entire team") ||
        text.includes("server")
    ) {
        priority = "High";
    } else if (
        text.includes("slow") ||
        text.includes("sometimes") ||
        text.includes("issue")
    ) {
        priority = "Medium";
    } else {
        priority = "Low";
    }

    return {
        category,
        priority
    };
}

module.exports = triageAgent;