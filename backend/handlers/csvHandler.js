const QuestionModel = require('../models/questionModel');
const QuizModel = require('../models/quizModel');
const SelfStudyModel = require('../models/selfStudyModel');

// Levenshtein distance for fuzzy string matching (used to catch typos)
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Normalize and match safely checks string variations
function normalizeAndMatch(inputStr, dbArray, nameKey, idKey) {
  if (!inputStr) return null;
  const target = inputStr.trim().toLowerCase();
  
  // 1. Direct lowercase match
  let exactMatch = dbArray.find(item => item[nameKey] && item[nameKey].trim().toLowerCase() === target);
  if (exactMatch) return exactMatch[idKey];

  // 2. Fuzzy match to catch typos
  let bestMatch = null;
  let minDistance = Infinity;

  for (const item of dbArray) {
    if (!item[nameKey]) continue;
    const itemNameStr = item[nameKey].trim().toLowerCase();
    const distance = getEditDistance(target, itemNameStr);
    
    // Dynamic constraint threshold based on word length
    let threshold = 1;
    if (target.length > 6) threshold = 2;
    if (target.length > 12) threshold = 3;
    
    if (distance <= threshold && distance < minDistance) {
      minDistance = distance;
      bestMatch = item[idKey];
    }
  }

  return bestMatch;
}

/**
 * Handle parsed CSV data — bulk insert questions and create file record
 * Includes dynamic hierarchy resolution natively creating categories, subjects, etc.
 */
async function handleCSVUpload({ questions, fileName, fileUrl, categoryId, subject, topic, microTopic, userId, isTournament, isSolvedPaper, year, month }) {
  
  // Cache to avoid hitting DB thousands of times
  const cache = {
    categories: await SelfStudyModel.getAll(),
    subjects: {},
    topics: {},
    microTopics: {}
  };

  // Enhance questions heavily with IDs
  for (const q of questions) {
    // CATEGORY (from CSV category/exam field OR fallback to form 'subject' if not found)
    const qCatInfo = q.category || subject;
    let catId = null;

    if (categoryId) {
        catId = parseInt(categoryId);
    } else {
        catId = normalizeAndMatch(qCatInfo, cache.categories, 'name', 'category_id');
    }
    
    // Title case formatter for new creation
    const titleCase = (str) => str.replace(/\b\w/g, c => c.toUpperCase());
    
    if (qCatInfo && !catId) {
       const cleanName = titleCase(qCatInfo.trim());
       const newCat = await SelfStudyModel.createCategory(cleanName);
       cache.categories.push(newCat);
       catId = newCat.category_id;
    }
    q.category_id = catId || null;

    // SUBJECT
    const qSubInfo = q.subject || (qCatInfo ? topic : null); // Fallback logic
    let subId = null;
    if (catId && qSubInfo) {
      if (!cache.subjects[catId]) cache.subjects[catId] = await SelfStudyModel.getSubjects(catId);
      subId = normalizeAndMatch(qSubInfo, cache.subjects[catId], 'name', 'subject_id');
      if (!subId) {
        const cleanName = titleCase(qSubInfo.trim());
        const newSub = await SelfStudyModel.createSubject(catId, cleanName);
        cache.subjects[catId].push(newSub);
        subId = newSub.subject_id;
      }
    }
    q.subject_id = subId;

    // TOPIC
    const qTopInfo = q.topic || (qSubInfo ? microTopic : null); 
    let topId = null;
    if (subId && qTopInfo) {
      if (!cache.topics[subId]) cache.topics[subId] = await SelfStudyModel.getTopics(subId);
      topId = normalizeAndMatch(qTopInfo, cache.topics[subId], 'name', 'topic_id');
      if (!topId) {
        const cleanName = titleCase(qTopInfo.trim());
        const newTop = await SelfStudyModel.createTopic(subId, cleanName);
        cache.topics[subId].push(newTop);
        topId = newTop.topic_id;
      }
    }
    q.topic_id = topId;

    // MICRO-TOPIC
    const qMicroInfo = q.micro_topic;
    let mTopId = null;
    if (topId && qMicroInfo) {
      if (!cache.microTopics[topId]) cache.microTopics[topId] = await SelfStudyModel.getMicroTopics(topId);
      mTopId = normalizeAndMatch(qMicroInfo, cache.microTopics[topId], 'name', 'micro_topic_id');
      if (!mTopId) {
        const cleanName = titleCase(qMicroInfo.trim());
        const newMTop = await SelfStudyModel.createMicroTopic(topId, cleanName);
        cache.microTopics[topId].push(newMTop);
        mTopId = newMTop.micro_topic_id;
      }
    }
    q.micro_topic_id = mTopId;
  }

  // File level tracking picks first item's text string for UI fallback
  const firstCatStr = questions[0]?.category || subject || null;
  const firstSubStr = questions[0]?.subject || topic || null;
  const firstTopStr = questions[0]?.topic || microTopic || null;

  // 1. Create question_files record
  const fileRecord = await QuizModel.createFile({
    uploaded_by: userId,
    file_name: fileName,
    file_url: fileUrl,
    subject: firstCatStr,
    topic: firstSubStr,
    micro_topic: firstTopStr,
    question_count: questions.length,
    status: isTournament ? 'Archived' : (isSolvedPaper ? 'Published' : 'Draft'),
    is_solved_paper: isSolvedPaper || false,
    year: year || null,
    month: month || null
  });

  // 2. Bulk insert questions linked to this file
  const inserted = await QuestionModel.bulkCreate(questions, fileRecord.file_id, userId);

  // 3. Update question count
  await QuizModel.updateQuestionCount(fileRecord.file_id, inserted.length);

  return {
    file: fileRecord,
    insertedCount: inserted.length,
    totalParsed: questions.length
  };
}

module.exports = { handleCSVUpload };