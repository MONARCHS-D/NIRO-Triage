import 'priority.dart';

class Symptom {
  final String id;
  final String name;
  final String duration;
  final String severity; // MILD, MODERATE, SEVERE
  final String source; // VOICE, MANUAL, REPORT, PHOTO
  final double confidence;

  const Symptom({
    required this.id,
    required this.name,
    required this.duration,
    required this.severity,
    required this.source,
    required this.confidence,
  });

  Symptom copyWith({
    String? id,
    String? name,
    String? duration,
    String? severity,
    String? source,
    double? confidence,
  }) {
    return Symptom(
      id: id ?? this.id,
      name: name ?? this.name,
      duration: duration ?? this.duration,
      severity: severity ?? this.severity,
      source: source ?? this.source,
      confidence: confidence ?? this.confidence,
    );
  }
}

class VitalSign {
  final String field;
  final String label;
  final String value;
  final String unit;
  final bool isAbnormal;
  final String referenceRange;

  const VitalSign({
    required this.field,
    required this.label,
    required this.value,
    required this.unit,
    this.isAbnormal = false,
    this.referenceRange = '',
  });
}

class ExtractedFact {
  final String id;
  final String metric;
  final String value;
  final String unit;
  final String sourceProvenance;
  final String confidence; // High, Medium, Low
  final String referenceRange;
  final bool isFlagged;

  const ExtractedFact({
    required this.id,
    required this.metric,
    required this.value,
    required this.unit,
    required this.sourceProvenance,
    this.confidence = 'High',
    this.referenceRange = '',
    this.isFlagged = false,
  });
}

class TimelineEvent {
  final String id;
  final String timestamp;
  final String title;
  final String description;
  final String source; // VOICE, REPORT, REVIEWER, AI
  final String actor;

  const TimelineEvent({
    required this.id,
    required this.timestamp,
    required this.title,
    required this.description,
    required this.source,
    required this.actor,
  });
}

class MissingInfoItem {
  final String id;
  final String field;
  final String label;
  final String category; // VITALS, HISTORY, LABS
  final String status; // NOT_PROVIDED, PARTIAL
  final String reason;
  final String askPrompt;

  const MissingInfoItem({
    required this.id,
    required this.field,
    required this.label,
    required this.category,
    required this.status,
    required this.reason,
    required this.askPrompt,
  });
}

class RiskFlag {
  final String id;
  final String type;
  final String severity; // POTENTIAL_URGENCY, INCOMPLETE, ROUTINE
  final String description;
  final List<String> evidenceIds;

  const RiskFlag({
    required this.id,
    required this.type,
    required this.severity,
    required this.description,
    this.evidenceIds = const [],
  });
}

class AuditLogItem {
  final String id;
  final String timestamp;
  final String actor;
  final String actorRole;
  final String action;
  final String objectAffected;
  final String details;

  const AuditLogItem({
    required this.id,
    required this.timestamp,
    required this.actor,
    required this.actorRole,
    required this.action,
    required this.objectAffected,
    required this.details,
  });
}

class Patient {
  final String id;
  final String syntheticCode;
  final String name;
  final int age;
  final String gender;
  final String primaryLanguage;
  final bool translatedToEnglish;
  final String contactMasked;
  final String visitId;
  final String arrivalTime;
  final String chiefComplaint;
  final List<Symptom> symptoms;
  final List<String> relevantHistory;
  final Map<String, VitalSign> vitals;
  final List<ExtractedFact> facts;
  final List<MissingInfoItem> missingInfo;
  final List<RiskFlag> riskFlags;
  final List<TimelineEvent> timeline;
  final List<AuditLogItem> auditLog;
  final CaseStatus status;
  final Priority priority;
  final String facilityId;

  const Patient({
    required this.id,
    required this.syntheticCode,
    required this.name,
    required this.age,
    required this.gender,
    required this.primaryLanguage,
    this.translatedToEnglish = true,
    required this.contactMasked,
    required this.visitId,
    required this.arrivalTime,
    required this.chiefComplaint,
    this.symptoms = const [],
    this.relevantHistory = const [],
    this.vitals = const {},
    this.facts = const [],
    this.missingInfo = const [],
    this.riskFlags = const [],
    this.timeline = const [],
    this.auditLog = const [],
    this.status = CaseStatus.pendingReview,
    this.priority = Priority.green,
    this.facilityId = 'fac-chc-1',
  });

  Patient copyWith({
    String? id,
    String? syntheticCode,
    String? name,
    int? age,
    String? gender,
    String? primaryLanguage,
    bool? translatedToEnglish,
    String? contactMasked,
    String? visitId,
    String? arrivalTime,
    String? chiefComplaint,
    List<Symptom>? symptoms,
    List<String>? relevantHistory,
    Map<String, VitalSign>? vitals,
    List<ExtractedFact>? facts,
    List<MissingInfoItem>? missingInfo,
    List<RiskFlag>? riskFlags,
    List<TimelineEvent>? timeline,
    List<AuditLogItem>? auditLog,
    CaseStatus? status,
    Priority? priority,
    String? facilityId,
  }) {
    return Patient(
      id: id ?? this.id,
      syntheticCode: syntheticCode ?? this.syntheticCode,
      name: name ?? this.name,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      primaryLanguage: primaryLanguage ?? this.primaryLanguage,
      translatedToEnglish: translatedToEnglish ?? this.translatedToEnglish,
      contactMasked: contactMasked ?? this.contactMasked,
      visitId: visitId ?? this.visitId,
      arrivalTime: arrivalTime ?? this.arrivalTime,
      chiefComplaint: chiefComplaint ?? this.chiefComplaint,
      symptoms: symptoms ?? this.symptoms,
      relevantHistory: relevantHistory ?? this.relevantHistory,
      vitals: vitals ?? this.vitals,
      facts: facts ?? this.facts,
      missingInfo: missingInfo ?? this.missingInfo,
      riskFlags: riskFlags ?? this.riskFlags,
      timeline: timeline ?? this.timeline,
      auditLog: auditLog ?? this.auditLog,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      facilityId: facilityId ?? this.facilityId,
    );
  }
}
