SELECT
  event_date AS day,
  COUNT(*) AS pageviews,
  COUNT(DISTINCT visitor_id) AS unique_browsers,
  COUNT(DISTINCT CASE WHEN first_seen_date = event_date THEN analytics_events.visitor_id END) AS new_browsers,
  COUNT(DISTINCT CASE WHEN first_seen_date < event_date THEN analytics_events.visitor_id END) AS returning_browsers
FROM analytics_events
JOIN analytics_visitors USING (visitor_id)
WHERE event_type = 'pageview'
GROUP BY event_date
ORDER BY event_date DESC
LIMIT 31;

SELECT
  event_date AS day,
  page_path,
  COUNT(*) AS pageviews,
  COUNT(DISTINCT visitor_id) AS unique_browsers
FROM analytics_events
WHERE event_type = 'pageview'
GROUP BY event_date, page_path
ORDER BY event_date DESC, pageviews DESC
LIMIT 100;

SELECT
  event_date AS day,
  COALESCE(conversation_title, conversation_url) AS conversation,
  conversation_url AS url,
  COUNT(*) AS opens,
  COUNT(DISTINCT visitor_id) AS unique_browsers
FROM analytics_events
WHERE event_type = 'conversation_open'
GROUP BY event_date, conversation_url
ORDER BY event_date DESC, opens DESC
LIMIT 100;
