'use client';

import { useEffect, useState } from 'react';

const POWER_LAWS = [
  "Never outshine your boss or superior.",
  "Don’t rely too much on friends — sometimes, enemies can be more useful.",
  "Keep your true plans and intentions hidden.",
  "Speak less than needed; silence gives you power.",
  "Protect your reputation — it’s your most valuable asset.",
  "Always attract attention; being noticed is power.",
  "Let others do the work, but make sure you get the credit.",
  "Make people come to you — attract them with what they want.",
  "Prove your point through actions, not arguments.",
  "Stay away from negative or unlucky people — their energy spreads.",
  "Make others depend on you so they can’t turn against you.",
  "Use honesty and generosity wisely to lower others’ defenses.",
  "When asking for help, appeal to what benefits the other person.",
  "Act friendly, but observe and gather information quietly.",
  "Crush your enemies completely — leave no room for revenge.",
  "Use your absence to increase your value and respect.",
  "Be unpredictable — it keeps others nervous and cautious.",
  "Don’t isolate yourself — being cut off from people is dangerous.",
  "Know who you’re dealing with — avoid offending powerful people.",
  "Stay independent — don’t commit to anyone fully.",
  "Pretend to be less smart to outsmart others.",
  "Turn weakness into power by surrendering strategically.",
  "Focus your efforts on one strong target, not many small ones.",
  "Master the art of charm and diplomacy.",
  "Keep reinventing yourself to stay relevant and admired.",
  "Avoid blame — use others to take the fall when needed.",
  "Tap into people’s beliefs to build strong loyalty and influence.",
  "Take bold action — hesitation loses opportunities.",
  "Plan carefully from start to finish.",
  "Make your success look natural and effortless.",
  "Control the choices others have — so they always choose your way.",
  "Use people’s dreams and fantasies to your advantage.",
  "Find what motivates or controls each person.",
  "Carry yourself like royalty — people will treat you that way.",
  "Perfect your sense of timing — act at the right moment.",
  "Ignore what you can’t have — that’s the best revenge.",
  "Create striking and memorable visuals or events.",
  "Think freely, but behave in a way that fits in.",
  "Cause a little chaos to gain the upper hand.",
  "Don’t depend on free offers — they often come with hidden costs.",
  "Avoid replacing a great person directly — create your own legacy.",
  "Take down the leader, and the followers will scatter.",
  "Win people’s hearts and minds, not just their obedience.",
  "Reflect people’s behavior back at them to confuse and disarm them.",
  "Promote change carefully — too much at once creates resistance.",
  "Don’t appear too perfect — it creates envy and enemies.",
  "Know when to stop — going too far can destroy your success.",
  "Be adaptable — take the shape that best fits the situation."
];


export default function PowerLawsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % POWER_LAWS.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div 
      className="w-full bg-white py-0 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <h3 className="text-sm font-italics text-gray-500 mb-2  tracking-wider">
            The 48 Laws of Power
          </h3>
          <div className="relative h-12 flex items-center justify-center">
        
            <div 
              className="text-gray-700 text-lg font-medium text-center transition-opacity duration-500"
              style={{ minHeight: '20px' }}
            > 
              "{POWER_LAWS[currentIndex]}"
            </div>
          </div>
          <div className="mt-3 flex justify-center space-x-1 ">
            {POWER_LAWS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-600 ${
                  index === currentIndex ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}