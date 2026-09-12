/**
 * The footer: Molly's teal lily pattern, running the width of the room.
 *
 * The pattern tiles horizontally at its natural height, so the flowers stay
 * the same size at any width instead of stretching.
 */
export function Footer() {
  return (
    <footer className="palais-footer">
      <div
        className="palais-footer-band"
        style={{ backgroundImage: `url("${process.env.PUBLIC_URL}/palais/footer-floral.webp")` }}
      >
        {/* a gilt rule where the floor meets it */}
        <div aria-hidden className="palais-footer-rule" />
        {/* the light in the room reaches the top of the band */}
        <div aria-hidden className="palais-footer-light" />
      </div>
    </footer>
  );
}
