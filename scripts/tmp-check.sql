SELECT l.title AS lesson, q.type, q.prompt,
       (SELECT string_agg(o.text || CASE WHEN o."isCorrect" THEN ' [CORRECTA]' ELSE '' END, ' | ')
        FROM "QuestionOption" o WHERE o."questionId" = q.id) AS options
FROM "Question" q
JOIN "Lesson" l ON l.id = q."lessonId"
WHERE l.type = 'GAME'
ORDER BY l.title, q.prompt
LIMIT 60;
