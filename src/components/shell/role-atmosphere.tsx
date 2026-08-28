import type { ShellRole } from "@/lib/shell/navigation";

function RoleGeometry({ role }: { role: ShellRole }) {
  if (role === "coach") {
    return (
      <svg className="role-atmosphere__geometry" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <path d="M132 692 408 176h384l276 516Z" />
        <path d="M310 360h580M228 512h744M600 176v516" />
        <circle cx="600" cy="512" r="72" />
        <circle className="role-atmosphere__node" cx="494" cy="390" r="8" />
        <circle className="role-atmosphere__node" cx="706" cy="390" r="8" />
        <circle className="role-atmosphere__node" cx="600" cy="568" r="8" />
      </svg>
    );
  }

  if (role === "admin") {
    return (
      <svg className="role-atmosphere__geometry" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet">
        <path d="M250 585 470 430 684 520 924 286M470 430l78-210m136 300 110-236M470 430l324-146" />
        <circle cx="250" cy="585" r="10" />
        <circle cx="470" cy="430" r="18" />
        <circle cx="548" cy="220" r="9" />
        <circle cx="684" cy="520" r="10" />
        <circle cx="794" cy="284" r="16" />
        <circle cx="924" cy="286" r="8" />
      </svg>
    );
  }

  if (role === "superadmin") {
    return (
      <svg className="role-atmosphere__geometry" viewBox="0 0 1200 800">
        <ellipse cx="720" cy="420" rx="292" ry="204" />
        <ellipse cx="720" cy="420" rx="292" ry="82" />
        <ellipse cx="720" cy="420" rx="112" ry="204" />
        <path d="M430 420h580M492 290h456M492 550h456" />
        <circle className="role-atmosphere__node" cx="492" cy="290" r="8" />
        <circle className="role-atmosphere__node" cx="854" cy="338" r="10" />
        <circle className="role-atmosphere__node" cx="650" cy="550" r="7" />
        <circle className="role-atmosphere__node" cx="980" cy="440" r="8" />
      </svg>
    );
  }

  return (
    <svg className="role-atmosphere__geometry" viewBox="0 0 1200 800" preserveAspectRatio="none">
      <path d="M118 632c214-8 426-98 592-270 102-106 228-174 386-202" />
      <path d="M174 690c246-24 466-130 630-314 72-80 158-138 260-174" />
      <circle className="role-atmosphere__node" cx="710" cy="362" r="7" />
      <circle className="role-atmosphere__node" cx="804" cy="376" r="5" />
    </svg>
  );
}

export function RoleAtmosphere({ role }: { role: ShellRole }) {
  return (
    <div className="role-atmosphere" data-world={role} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="role-atmosphere__image"
        src="/img/back/backstad.webp"
        alt=""
      />
      <div className="role-atmosphere__grade" />
      <div className="role-atmosphere__vignette" />
      <div className="role-atmosphere__light" />
      <RoleGeometry role={role} />
    </div>
  );
}
