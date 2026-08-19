export interface LevelItemConfig {
  type: 'collectible' | 'enemy' | 'obstacle' | 'finish';
  distance: number;
  yOffset?: number;
  pauseForTutorial?: boolean;
  warningLabel?: boolean;
}

export const LEVEL_TRACK_DATA: LevelItemConfig[] = [
  { type: 'enemy', distance: 3, pauseForTutorial: true },

  // Arc 1 - Tutorial jump arc (higher upward arc, wider spacing)
  { type: 'collectible', distance: 3.9, yOffset: 60 },
  { type: 'collectible', distance: 4.2, yOffset: 180 },
  { type: 'collectible', distance: 4.5, yOffset: 300 },
  { type: 'collectible', distance: 4.8, yOffset: 180 },
  { type: 'collectible', distance: 5.1, yOffset: 60 },

  { type: 'obstacle', distance: 5.9, warningLabel: true },
  { type: 'collectible', distance: 6.6, yOffset: 40 },

  { type: 'enemy', distance: 7.3 },

  // Arc 2 - High soaring jump arc
  { type: 'collectible', distance: 8.0, yOffset: 70 },
  { type: 'collectible', distance: 8.3, yOffset: 200 },
  { type: 'collectible', distance: 8.6, yOffset: 320 },
  { type: 'collectible', distance: 8.9, yOffset: 200 },
  { type: 'collectible', distance: 9.2, yOffset: 70 },

  { type: 'obstacle', distance: 10.0, warningLabel: true },
  { type: 'collectible', distance: 10.7, yOffset: 40 },

  { type: 'enemy', distance: 11.4 },

  // Arc 3 - Medium jump arc
  { type: 'collectible', distance: 12.0, yOffset: 80 },
  { type: 'collectible', distance: 12.3, yOffset: 240 },
  { type: 'collectible', distance: 12.6, yOffset: 310 },
  { type: 'collectible', distance: 12.9, yOffset: 140 },

  { type: 'obstacle', distance: 13.6, warningLabel: true },

  { type: 'enemy', distance: 14.3 },

  // Arc 4 - Grand finale high arc
  { type: 'collectible', distance: 15.0, yOffset: 80 },
  { type: 'collectible', distance: 15.3, yOffset: 210 },
  { type: 'collectible', distance: 15.6, yOffset: 330 },
  { type: 'collectible', distance: 15.9, yOffset: 210 },
  { type: 'collectible', distance: 16.2, yOffset: 80 },

  { type: 'obstacle', distance: 17.0 },
  { type: 'finish', distance: 18.5 }
];
