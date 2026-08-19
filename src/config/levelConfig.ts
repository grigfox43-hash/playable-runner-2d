export interface LevelItemConfig {
  type: 'collectible' | 'enemy' | 'obstacle' | 'finish';
  distance: number;
  yOffset?: number;
  pauseForTutorial?: boolean;
  warningLabel?: boolean;
}

export const LEVEL_TRACK_DATA: LevelItemConfig[] = [
  { type: 'collectible', distance: 1 },
  { type: 'collectible', distance: 2 },
  { type: 'enemy', distance: 3, pauseForTutorial: true },
  { type: 'collectible', distance: 4, yOffset: 50 },
  { type: 'collectible', distance: 4.2, yOffset: 150 },
  { type: 'collectible', distance: 4.4, yOffset: 250 },
  { type: 'collectible', distance: 4.6, yOffset: 150 },
  { type: 'collectible', distance: 4.8, yOffset: 50 },
  { type: 'obstacle', distance: 5.6, warningLabel: true },
  { type: 'collectible', distance: 6.4 },
  { type: 'enemy', distance: 7 },
  { type: 'collectible', distance: 7.6 },
  { type: 'collectible', distance: 7.8, yOffset: 100 },
  { type: 'collectible', distance: 8, yOffset: 200 },
  { type: 'collectible', distance: 8.2, yOffset: 280 },
  { type: 'collectible', distance: 8.4, yOffset: 200 },
  { type: 'collectible', distance: 8.6, yOffset: 100 },
  { type: 'obstacle', distance: 9, warningLabel: true },
  { type: 'collectible', distance: 9.6 },
  { type: 'enemy', distance: 10 },
  { type: 'collectible', distance: 10.6 },
  { type: 'collectible', distance: 11, yOffset: 80 },
  { type: 'collectible', distance: 11.2, yOffset: 180 },
  { type: 'collectible', distance: 11.4, yOffset: 80 },
  { type: 'obstacle', distance: 12 },
  { type: 'enemy', distance: 12.6 },
  { type: 'collectible', distance: 13 },
  { type: 'collectible', distance: 13.2, yOffset: 100 },
  { type: 'collectible', distance: 13.4, yOffset: 200 },
  { type: 'collectible', distance: 13.6, yOffset: 100 },
  { type: 'obstacle', distance: 14, warningLabel: true },
  { type: 'collectible', distance: 14.5 },
  { type: 'enemy', distance: 15 },
  { type: 'collectible', distance: 15.4, yOffset: 80 },
  { type: 'collectible', distance: 15.6, yOffset: 180 },
  { type: 'collectible', distance: 15.8, yOffset: 260 },
  { type: 'collectible', distance: 16, yOffset: 180 },
  { type: 'collectible', distance: 16.2, yOffset: 80 },
  { type: 'obstacle', distance: 16.5 },
  { type: 'finish', distance: 18 }
];
