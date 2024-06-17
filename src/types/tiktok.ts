export interface ItemStruct {
  id: string;
  desc: string;
  createTime: string;
  scheduleTime: number;
  video: VideoDetail;
  author: AuthorDetail;
  music: MusicDetail;
  challenges: object[]; // tiktok garbage we dont care
  stats: object; // deprecated in favor of...
  statsV2: StatsDetail;
  warnInfo: [];
  originalItem: boolean;
  officalItem: boolean;
  textExtra: object[];
  secret: boolean;
  forFriend: boolean;
  digged: boolean;
  itemCommentStatus: number;
  takeDown: number; // ?
  effectStickers: [];
  privateItem: boolean;
  duetEnabled: boolean;
  stitchEnabled: boolean;
  stickersOnItem: [];
  shareEnabled: boolean;
  comments: [];
  duetDisplay: number;
  stitchDisplay: number;
  indexEnabled: boolean;
  diversificationLabels: string[];
  locationCreated: string;
  suggestedWords: string[];
  contents: Content[];
  playlistId: string;
  diversificationId: number;
  collected: boolean;
  channelTags: [];
  item_control: ItemControl;
  IsAigc: boolean;
  AIGCDescription: string;
}

export interface Content {
  desc: string;
  textExtra: TextExtra[];
}

export interface TextExtra {
  awemeId: string;
  start: number;
  end: number;
  hashtagId: string;
  hashtagName: string;
  type: number;
  subType: number;
  isCommerce: boolean;
}

export interface ItemControl {
  can_repost: boolean;
}

export interface VideoDetail {
  id: string;
  height: number;
  width: number;
  duration: number;
  ratio: string;
  cover: string;
  originCover: string;
  dynamicCover: string;
  playAddr: string;
  downloadAddr: string;
  shareCover: string[];
  reflowCover: string;
  bitrate: number;
  encodedType: string;
  format: string;
  videoQuality: string;
  encodeUserTag: string;
  definition: string;
  subtitleInfos: SubtitleDetail[];
  zoomCover: Record<string, string>;
  volumeInfo: {
    Loudness: number;
    Peak: number;
  };
  bitrateInfo: BitrateInfo[];
}

export interface SubtitleDetail {
  UrlExpire: string;
  Size: string;
  LanguageID: string;
  LanguageCodeName: string;
  Url: string;
  Format: string;
  Version: string;
  Source: string;
}

export interface BitrateInfo {
  Bitrate: number;
  QualityType: number;
  GearName: string;
  PlayAddr: {
    DataSize: number;
    Uri: number;
    UrlList: string[];
    UrlKey: string;
    FileHash: string;
    FileCs: string;
  };
  CodecType: string;
}

export interface AuthorDetail {
  id: string;
  shortId: string;
  uniqueId: string;
  nickname: string;
  avatarLarger: string;
  avatarMedium: string;
  avatarThumb: string;
  signature: string;
  createTime: number;
  verified: boolean;
  secUid: string;
  ftc: boolean;
  relation: number;
  openFavorite: boolean;
  commentSetting: number;
  duetSetting: number;
  stitchSetting: number;
  privateAccount: boolean;
  secret: boolean;
  isADVirtual: boolean;
  roomId: string;
  uniqueIdModifyTime: number;
  ttSeller: boolean;
  downloadSetting: number;
  recommendReason: string;
  nowInvitationCardUrl: string;
  nickNameModifyTime: number;
  isEmbedBanned: boolean;
  canExpPlaylist: boolean;
  suggestAccountBind: boolean;
}

export interface MusicDetail {
  id: string;
  title: string;
  playUrl: string;
  coverLarge: string;
  coverMedium: string;
  coverThumb: string;
  authorName: string;
  original: boolean;
  duration: number;
  scheduleSearchTime: number;
  collected: boolean;
  preciseDuration: PreciseDuration;
}

export interface PreciseDuration {
  preciseDuration: number;
  preciseShootDuration: number;
  preciseAuditionDuration: number;
  preciseVideoDuration: number;
}

export interface StatsDetail {
  diggCount: string;
  shareCount: string;
  commentCount: string;
  playCount: string;
  collectCount: string;
  repostCount: string;
}
