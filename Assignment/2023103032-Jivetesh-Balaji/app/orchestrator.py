import re

from .knowledge import search_knowledge
from .policy import authorize
from .tools import create_ticket, list_tickets, get_asset, reset_password
from .approvals import create_approval


class AgentOrchestrator:
    def __init__(self):
        self.trace = []

    def log(self, step, detail):
        self.trace.append({
            "step": step,
            "detail": detail
        })

    def classify(self, message: str):
        q = message.lower()

        if any(x in q for x in [
            "reset password",
            "change password",
            "forgot password",
            "password reset",
            "reset my password"
        ]):
            return "reset_password"

        if any(x in q for x in [
            "another employee",
            "other employee",
            "employee asset",
            "asset u1002",
            "asset u1003",
            "asset u1004"
        ]):
            return "view_any_asset"

        if any(x in q for x in [
            "my tickets",
            "show tickets",
            "ticket status",
            "list tickets",
            "my ticket"
        ]):
            return "view_tickets"

        if any(x in q for x in [
            "my asset",
            "my laptop",
            "my device",
            "my computer",
            "asset information"
        ]):
            return "view_asset"

        if any(x in q for x in [
            "ticket",
            "problem",
            "issue",
            "not working",
            "broken",
            "overheating",
            "error",
            "request"
        ]):
            return "create_ticket"

        return "search_knowledge"

    def _authorize(self, action, user_id, role, target_user_id=None):
        try:
            result = authorize(
                action,
                user_id,
                role,
                target_user_id
            )
            if isinstance(result, tuple):
                return bool(result[0])
            return bool(result)
        except TypeError:
            pass

        try:
            result = authorize(
                action,
                role,
                user_id,
                target_user_id
            )
            if isinstance(result, tuple):
                return bool(result[0])
            return bool(result)
        except TypeError:
            pass

        try:
            result = authorize(role, action)
            if isinstance(result, tuple):
                return bool(result[0])
            return bool(result)
        except TypeError:
            pass

        if role == "ADMIN":
            return True

        allowed = {
            "search_knowledge",
            "create_ticket",
            "view_tickets",
            "view_asset"
        }

        return action in allowed

    def _create_approval(self, action, user_id, role, target):
        return create_approval(user_id, role, action, target)

    def _get_target_user(self, message, current_user_id):
        match = re.search(r"\bU\d{3,}\b", message.upper())

        if match:
            return match.group(0)

        return current_user_id

    def _create_ticket(self, user_id, message):
        try:
            return create_ticket(user_id, message)
        except TypeError:
            pass

        try:
            return create_ticket(
                description=message,
                user_id=user_id
            )
        except TypeError:
            pass

        return create_ticket(message, user_id)

    def _list_tickets(self, user_id):
        try:
            return list_tickets(user_id)
        except TypeError:
            return list_tickets(user_id=user_id)

    def _get_asset(self, user_id, role, target_user=None):
        return get_asset(user_id, role, target_user)

    def _reset_password(self, user_id):
        try:
            return reset_password(user_id)
        except TypeError:
            return reset_password(user_id=user_id)

    def execute(self, message, user_id, role):
        self.trace = []

        self.log("RECEIVED", message)

        intent = self.classify(message)

        self.log(
            "ANALYZING",
            f"Intent detected: {intent}"
        )

        self.log(
            "PLANNING",
            f"Create execution plan for {intent}"
        )

        if intent == "search_knowledge":
            action = "search_knowledge"

            self.log(
                "AUTHORIZING",
                f"Checking {action} permission"
            )

            if not self._authorize(
                action,
                user_id,
                role
            ):
                self.log(
                    "FAILED",
                    "Authorization denied at tool boundary"
                )
                return (
                    "Access denied: your role cannot search IT knowledge.",
                    False,
                    None
                )

            results = search_knowledge(message)

            self.log(
                "RETRIEVING",
                f"Knowledge results: {len(results)}"
            )

            if not results:
                self.log(
                    "VERIFYING",
                    "No knowledge result found"
                )
                return (
                    "I could not find a matching IT knowledge article.",
                    False,
                    None
                )

            result = results[0]

            if isinstance(result, dict):
                title = result.get("title", "Knowledge Result")
                content = result.get(
                    "content",
                    result.get("answer", "")
                )
                response = f"**{title}**\n{content}"
            else:
                response = str(result)

            self.log(
                "VERIFYING",
                "Knowledge response prepared"
            )

            return response, False, None

        if intent == "create_ticket":
            action = "create_ticket"

            self.log(
                "AUTHORIZING",
                f"Checking {action} permission"
            )

            if not self._authorize(
                action,
                user_id,
                role
            ):
                self.log(
                    "FAILED",
                    "Authorization denied at tool boundary"
                )
                return (
                    "Access denied: your role cannot create tickets.",
                    False,
                    None
                )

            ticket = self._create_ticket(
                user_id,
                message
            )

            if isinstance(ticket, dict):
                ticket_id = ticket.get(
                    "ticket_id",
                    ticket.get("id", "UNKNOWN")
                )
                status = ticket.get(
                    "status",
                    "OPEN"
                )
            else:
                ticket_text = str(ticket)
                match = re.search(
                    r"TKT-\d+",
                    ticket_text
                )
                ticket_id = (
                    match.group(0)
                    if match
                    else "UNKNOWN"
                )
                status = "OPEN"

            self.log(
                "EXECUTING",
                f"Created {ticket_id}"
            )

            self.log(
                "VERIFYING",
                "Ticket creation successful"
            )

            return (
                f"Ticket {ticket_id} created successfully with status {status}.",
                False,
                None
            )

        if intent == "view_tickets":
            action = "view_tickets"

            self.log(
                "AUTHORIZING",
                f"Checking {action} permission"
            )

            if not self._authorize(
                action,
                user_id,
                role
            ):
                self.log(
                    "FAILED",
                    "Authorization denied at tool boundary"
                )
                return (
                    "Access denied: your role cannot view tickets.",
                    False,
                    None
                )

            tickets = self._list_tickets(user_id)

            if isinstance(tickets, list):
                if not tickets:
                    response = "You currently have no accessible tickets."
                else:
                    lines = []

                    for ticket in tickets:
                        if isinstance(ticket, dict):
                            ticket_id = ticket.get(
                                "ticket_id",
                                ticket.get("id", "UNKNOWN")
                            )
                            description = ticket.get(
                                "description",
                                ""
                            )
                            status = ticket.get(
                                "status",
                                "OPEN"
                            )
                            lines.append(
                                f"{ticket_id}: {description} - {status}"
                            )
                        else:
                            lines.append(str(ticket))

                    response = (
                        "Your accessible tickets:\n"
                        + "\n".join(lines)
                    )
            else:
                response = str(tickets)

            self.log(
                "EXECUTING",
                "Retrieved accessible tickets"
            )

            self.log(
                "VERIFYING",
                "Ticket list prepared"
            )

            return response, False, None

        if intent == "view_asset":
            action = "view_asset"

            self.log(
                "AUTHORIZING",
                f"Checking {action} permission"
            )

            if not self._authorize(
                action,
                user_id,
                role
            ):
                self.log(
                    "FAILED",
                    "Authorization denied at tool boundary"
                )
                return (
                    "Access denied: your role cannot view asset information.",
                    False,
                    None
                )

            asset = self._get_asset(user_id, role)

            self.log(
                "EXECUTING",
                "Own asset lookup"
            )

            self.log(
                "VERIFYING",
                "Asset information retrieved"
            )

            return str(asset), False, None

        if intent == "view_any_asset":
            target_user_id = self._get_target_user(
                message,
                user_id
            )

            if target_user_id == user_id:
                action = "view_asset"
            else:
                action = "view_any_asset"

            self.log(
                "AUTHORIZING",
                f"Checking {action} permission"
            )

            if not self._authorize(
                action,
                user_id,
                role,
                target_user_id
            ):
                self.log(
                    "FAILED",
                    "Authorization denied at tool boundary"
                )
                return (
                    "Access denied: your role cannot view another employee's asset information.",
                    False,
                    None
                )

            asset = self._get_asset(user_id, role, target_user_id)

            self.log(
                "EXECUTING",
                "Authorized asset lookup"
            )

            self.log(
                "VERIFYING",
                "Asset information retrieved"
            )

            return str(asset), False, None

        if intent == "reset_password":
            target_user_id = self._get_target_user(
                message,
                user_id
            )

            action = "reset_password"

            self.log(
                "AUTHORIZING",
                f"Checking {action} permission"
            )

            if not self._authorize(
                action,
                user_id,
                role,
                target_user_id
            ):
                self.log(
                    "FAILED",
                    "Authorization denied at tool boundary"
                )
                return (
                    "Access denied: password reset is not permitted for your role.",
                    False,
                    None
                )

            approval = self._create_approval(
                action,
                user_id,
                role,
                target_user_id
            )

            if isinstance(approval, dict):
                approval_id = approval.get(
                    "approval_id",
                    approval.get("id")
                )
            elif isinstance(approval, tuple):
                approval_id = (
                    approval[0]
                    if approval
                    else None
                )
            else:
                approval_id = str(approval)

            self.log(
                "AWAITING_APPROVAL",
                f"Approval required: {approval_id}"
            )

            return (
                f"Password reset requires human approval. Approval ID: {approval_id}",
                True,
                approval_id
            )

        self.log(
            "FAILED",
            "Unsupported intent"
        )

        return (
            "I could not process that request.",
            False,
            None
        )
