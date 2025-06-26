-- get_friends_with_active_stories.sql
-- Returns friends with at least one active (unexpired) story and their latest story info

create or replace function get_friends_with_active_stories(current_user_id uuid)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  latest_story_id uuid,
  latest_story_media_url text,
  latest_story_media_type text,
  latest_story_created_at timestamptz,
  latest_story_expires_at timestamptz
)
language sql
as $$
  select
    p.id as user_id,
    p.username,
    p.avatar_url,
    s.id as latest_story_id,
    s.media_url as latest_story_media_url,
    s.media_type as latest_story_media_type,
    s.created_at as latest_story_created_at,
    s.expires_at as latest_story_expires_at
  from friendships f
  join profiles p
    on (p.id = f.user1_id and f.user2_id = current_user_id)
    or (p.id = f.user2_id and f.user1_id = current_user_id)
  join lateral (
    select *
    from stories
    where stories.user_id = p.id
      and stories.expires_at > now()
    order by stories.created_at desc
    limit 1
  ) s on true
  where p.id != current_user_id
$$; 