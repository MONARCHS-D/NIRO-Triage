class AiFollowUpQuestion {
  final String id;
  final String question;
  final String clinicalRationale;
  final String? relatedMissingInfoId;
  final List<String> options;
  final String? selectedAnswer;
  final bool isAnswered;

  const AiFollowUpQuestion({
    required this.id,
    required this.question,
    required this.clinicalRationale,
    this.relatedMissingInfoId,
    this.options = const ['Yes', 'No', 'Not sure'],
    this.selectedAnswer,
    this.isAnswered = false,
  });

  AiFollowUpQuestion copyWith({
    String? id,
    String? question,
    String? clinicalRationale,
    String? relatedMissingInfoId,
    List<String>? options,
    String? selectedAnswer,
    bool? isAnswered,
  }) {
    return AiFollowUpQuestion(
      id: id ?? this.id,
      question: question ?? this.question,
      clinicalRationale: clinicalRationale ?? this.clinicalRationale,
      relatedMissingInfoId: relatedMissingInfoId ?? this.relatedMissingInfoId,
      options: options ?? this.options,
      selectedAnswer: selectedAnswer ?? this.selectedAnswer,
      isAnswered: isAnswered ?? this.isAnswered,
    );
  }
}
