-- Bring published Arabic blog post count down to 100 (matching English's 100)
-- by unpublishing the 11 lowest seo_score Arabic posts. Rows are kept, not
-- deleted, so they can be republished later if desired.
update blog_posts set published = false where id in (
  '99b343c7-36bf-491a-8ff1-50c2eed4db41', -- korean-future-tense-plans-guide-ar
  'f5a6d0e4-230b-44f4-8abd-56aef9745780', -- korean-passive-voice-grammar-ar
  'e371ec20-ca9f-400a-aaa6-a2cd78296b1d', -- korean-causative-verbs-grammar-ar
  '4a2d64d7-e4c1-4a2d-9264-293c1aa4a0b7', -- korean-comparative-superlative-guide-ar
  '125ade06-d812-4e2e-8114-99edc5fc5410', -- korean-imperative-suggestion-grammar-ar
  '9be8c9d2-ca3b-4181-ae43-51807c97501f', -- korean-purpose-intention-grammar-ar
  'aef0962d-9db0-4791-98ba-426054ff62a3', -- korean-ability-expressions-grammar-ar
  '5adcd636-d12f-490f-abc8-66c7ecf8c50c', -- korean-past-experience-grammar-ar
  '75a1d554-10db-4572-9c06-ede12399f5f4', -- korean-money-banking-vocabulary-ar
  'a502125f-4056-4f2c-b6a7-9d96e1391734', -- korean-compliment-praise-phrases-ar
  '0a9a63fd-6491-4477-9928-24413d12e093'  -- korean-gaming-culture-pcbang-ar
);
