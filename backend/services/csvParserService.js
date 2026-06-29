const fs = require('fs');
const { parse } = require('csv-parse');

/**
 * Parse a CSV file and return an array of question objects
 * Expected CSV columns: full_question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, hint, difficulty_label, exam, question_type, primary_concept
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const questions = [];
    const errors = [];

    const parser = parse({
      columns: headers => headers.map(header => {
        const h = header.toLowerCase().trim();
        if (h.includes('full_question_text')) return 'full_question_text';
        if (h.includes('option_a')) return 'option_a';
        if (h.includes('option_b')) return 'option_b';
        if (h.includes('option_c')) return 'option_c';
        if (h.includes('option_d')) return 'option_d';
        if (h.includes('correct answer')) return 'correct_answer';
        if (h.includes('hint')) return 'hint';
        if (h.includes('explanation')) return 'explanation';
        if (h.includes('difficulty_label') || h.includes('difficulty levels')) return 'difficulty_label';
        if (h.includes('exam') || h === 'category') return 'category';
        if (h.includes('subject')) return 'subject';
        if (h.includes('micro') && h.includes('topic')) return 'micro_topic';
        if (h.includes('topic') && !h.includes('micro') && !h.includes('sub')) return 'topic';
        if (h.includes('question_type')) return 'question_type';
        if (h.includes('primary_concept')) return 'primary_concept';
        return h.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      }),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      delimiter: [',', '\t', ';'] // Try multiple delimiters for resilient parsing
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        // Validate required fields
        if (!record.full_question_text || !record.correct_answer) {
          errors.push({
            row: questions.length + errors.length + 2, // +2 for header and 0-index
            message: 'Missing required field: full_question_text or correct_answer'
          });
          continue;
        }

        // Normalize difficulty label to fit CHECK constraint ('Easy', 'Medium', 'Hard')
        let diff = record.difficulty_label || 'Medium';
        if (diff.toLowerCase() === 'moderate') diff = 'Medium';
        if (diff.toLowerCase() === 'expert' || diff.toLowerCase() === 'difficult') diff = 'Hard';
        diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase(); // Ensure capitalization matches like 'Easy'

        questions.push({
          full_question_text: record.full_question_text,
          option_a: record.option_a || null,
          option_b: record.option_b || null,
          option_c: record.option_c || null,
          option_d: record.option_d || null,
          correct_answer: record.correct_answer,
          explanation: record.explanation || null,
          hint: record.hint || null,
          difficulty_label: diff,
          category: record.category || null,
          subject: record.subject || null,
          topic: record.topic || null,
          micro_topic: record.micro_topic || null,
          question_type: record.question_type || 'MCQ',
          primary_concept: record.primary_concept || null
        });
      }
    });

    parser.on('error', (err) => {
      reject(err);
    });

    parser.on('end', () => {
      resolve({ questions, errors });
    });

    // Read file and pipe to parser
    fs.createReadStream(filePath).pipe(parser);
  });
}

module.exports = { parseCSV };
