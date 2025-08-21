CREATE EXTENSION "pgcrypto";

CREATE TABLE users
(
    id         UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    google_id  VARCHAR(255) NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL UNIQUE,
    full_name  VARCHAR(255) NOT NULL,
    reputation INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    picture    TEXT NOT NULL DEFAULT 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg'
);


CREATE TABLE notes
(
    id                UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    course_name       VARCHAR(255) NOT NULL,
    course_code       VARCHAR(50)  NOT NULL,
    description       TEXT,
    professor_names   TEXT[],
    tags              TEXT[]       NOT NULL DEFAULT '{}',
    is_public         BOOLEAN      NOT NULL DEFAULT TRUE,
    has_preview_image BOOLEAN      NOT NULL DEFAULT FALSE,
    uploader_user_id  UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    downloads         INT          NOT NULL DEFAULT 0
);


CREATE TABLE votes
(
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    note_id    UUID    NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
    is_upvote  BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ      DEFAULT NOW(),
    UNIQUE (user_id, note_id)
);