/// Priority and Clinical Case Status definitions matching Section 16 of design.md
enum Priority {
  green,
  yellow,
  red,
  grey;

  String get label {
    switch (this) {
      case Priority.green:
        return 'Routine';
      case Priority.yellow:
        return 'Prompt Review';
      case Priority.red:
        return 'Potential Urgency';
      case Priority.grey:
        return 'Insufficient Info';
    }
  }

  String get code {
    switch (this) {
      case Priority.green:
        return 'GREEN';
      case Priority.yellow:
        return 'YELLOW';
      case Priority.red:
        return 'RED';
      case Priority.grey:
        return 'GREY';
    }
  }
}

enum CaseStatus {
  created,
  processing,
  aiDraft,
  pendingReview,
  needsMoreInfo,
  reviewed,
  escalated,
  approved;

  String get label {
    switch (this) {
      case CaseStatus.created:
        return 'Created';
      case CaseStatus.processing:
        return 'Processing';
      case CaseStatus.aiDraft:
        return 'AI Draft';
      case CaseStatus.pendingReview:
        return 'Pending Review';
      case CaseStatus.needsMoreInfo:
        return 'Needs More Info';
      case CaseStatus.reviewed:
        return 'Reviewed';
      case CaseStatus.escalated:
        return 'Escalated to MO';
      case CaseStatus.approved:
        return 'Approved';
    }
  }

  String get code {
    switch (this) {
      case CaseStatus.created:
        return 'CREATED';
      case CaseStatus.processing:
        return 'PROCESSING';
      case CaseStatus.aiDraft:
        return 'AI_DRAFT';
      case CaseStatus.pendingReview:
        return 'PENDING_REVIEW';
      case CaseStatus.needsMoreInfo:
        return 'NEEDS_MORE_INFO';
      case CaseStatus.reviewed:
        return 'REVIEWED';
      case CaseStatus.escalated:
        return 'ESCALATED';
      case CaseStatus.approved:
        return 'APPROVED';
    }
  }
}
