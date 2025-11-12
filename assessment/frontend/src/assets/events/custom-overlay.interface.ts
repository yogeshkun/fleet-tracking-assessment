
export interface OverlayOptions {
  image: string;
  position: {
    lat: number;
    lng: number;
  };
  angle: number;
  path: path[];
  isSmoothReCenter: boolean;
  isSmoothTurn: boolean;
  speed: number;
  zIndex?: string;
  height: string;
  width: string;
  marginTop: string;
  marginLeft: string;
  locationIcon: string;
  speedIcon: string;
  odometerIcon: string;
  isLabel: boolean;
  labelStyling: {
    left: number;
    top: number;
  },
}

export interface path {
  lat: number;
  lng: number;
  degree: number;
  vehicleSpeed?: number;
  eventDateTime?: string;
  odometer?: number;
};
