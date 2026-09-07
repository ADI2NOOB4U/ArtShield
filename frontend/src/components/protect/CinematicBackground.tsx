import React from "react";

interface CinematicBackgroundProps {
	reducedMotion?: boolean;
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ reducedMotion = false }) => {
	return (
		<div className={`pc-bg ${reducedMotion ? "pc-bg--reduced" : ""}`} aria-hidden="true">
			{/* Volumetric ambient spotlight */}
			<div className="pc-bg__spotlight" />

			{/* Slow drifting gradient orbs */}
			<div className="pc-bg__orb pc-bg__orb--1" />
			<div className="pc-bg__orb pc-bg__orb--2" />
			<div className="pc-bg__orb pc-bg__orb--3" />

			{/* Precision technical grid overlay */}
			<div className="pc-bg__grid" />

			{/* Subtle scanline / texture filter */}
			<div className="pc-bg__vignette" />
		</div>
	);
};

