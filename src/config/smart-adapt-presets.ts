export const getCameraPrompt = (degrees: number): string => {
    if (degrees === 0) return "Front view, straight-on camera angle.";
    
    const direction = degrees > 0 ? "right" : "left";
    const absDeg = Math.abs(degrees);
    
    // Normalize 180
    if (absDeg === 180) return "Full back view, camera positioned directly behind the subject.";

    switch (absDeg) {
        case 15: return `Slightly off-center camera angle, rotated 15 degrees to the ${direction}.`;
        case 30: return `Angled camera shot from the ${direction}, 30 degree rotation.`;
        case 45: return `Standard 3/4 view from the ${direction}, camera positioned at 45 degree angle.`;
        case 60: return `Deep 3/4 angle from the ${direction}, emphasizing the ${direction} side profile.`;
        case 75: return `Wide angle shot from the ${direction}, nearly side profile.`;
        case 90: return `Full side profile shot, camera positioned 90 degrees to the ${direction}.`;
        case 105: return `Over-the-shoulder shot from the ${direction} rear.`;
        case 120: return `Rear 3/4 view from the ${direction}, camera positioned behind the subject.`;
        case 135: return `Back-diagonal angle from the ${direction}.`;
        case 150: return `Camera positioned behind, slightly angled ${direction}.`;
        case 165: return `Direct rear shot with slight ${direction} tilt, almost full back view.`;
        default: return "";
    }
};
