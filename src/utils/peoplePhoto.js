// The small copy of a portrait, made by scripts/people-thumbs.sh. Anywhere a
// portrait shows at a modest size should use this; only a person's own bio
// window shows the original.
export function thumbOf(photo) {
  return photo.replace("/images/people/", "/images/people/thumbs/");
}
