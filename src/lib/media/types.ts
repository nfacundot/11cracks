export type MediaKind =
  | "brand-logo"
  | "club-logo"
  | "player-photo"
  | "role-photo"
  | "environment-photo"
  | "game-scene"
  | "learning-asset"
  | "generated-interface-asset";

export type MediaOrigin =
  | "official-library"
  | "existing-project-library"
  | "generated"
  | "commissioned";

export type MediaReviewStatus =
  | "production-approved"
  | "candidate"
  | "phase-demo"
  | "reference-only";

export type MediaRightsStatus =
  | "owned"
  | "licensed"
  | "demo-fictional"
  | "approval-required";

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  src: string;
  alt: string;
  dimensions?: MediaDimensions;
  origin: MediaOrigin;
  reviewStatus: MediaReviewStatus;
  rightsStatus?: MediaRightsStatus;
  contentVersion: string;
}
