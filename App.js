import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { GameEngine } from "react-native-game-engine";
import Matter from "matter-js";

import Bird from "./components/Bird";
import Floor from "./components/Floor";
import Obstacle from "./components/Obstacle";

const windowHeight = Dimensions.get("window").height;
const windowWidth = Dimensions.get("window").width;

const getRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const getPipeSizePosPair = (addToPosX = 0, gap = 200) => {
  let yPosTop = -getRandom(300, windowHeight - 200);

  const pipeTop = {
    pos: { x: windowWidth + addToPosX, y: yPosTop },
    size: { height: windowHeight * 2, width: 70 },
  };
  const pipeBottom = {
    pos: { x: windowWidth + addToPosX, y: windowHeight * 2 + gap + yPosTop },
    size: { height: windowHeight * 2, width: 70 },
  };

  return { pipeTop, pipeBottom };
};

const DIFFICULTY = {
  EASY: {
    label: "easy",
    jumpHeight: -5,
    gap: 200,
  },
  MEDIUM: {
    label: "medium",
    jumpHeight: -5,
    gap: 150,
  },
  HARD: {
    label: "hard",
    jumpHeight: -5,
    gap: 100,
  },
};

export default function App() {
  const [running, setRunning] = useState(false);
  const [gameEngine, setGameEngine] = useState(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [difficulty, setDifficulty] = useState(DIFFICULTY.EASY);

  useEffect(() => {
    if (currentPoints === 4) {
      setDifficulty(DIFFICULTY.MEDIUM);
    } else if (currentPoints === 8) {
      setDifficulty(DIFFICULTY.HARD);
    }
  }, [currentPoints]);

  useEffect(() => {
    setRunning(false);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{
            margin: 20,
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          {difficulty.label.toUpperCase()}
        </Text>
        <Text
          style={{
            margin: 20,
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          SCORE: {currentPoints}
        </Text>
      </View>
      <GameEngine
        ref={(ref) => {
          setGameEngine(ref);
        }}
        systems={[Physics(difficulty)]}
        entities={entities(difficulty)}
        running={running}
        onEvent={(e) => {
          switch (e.type) {
            case "game_over":
              setRunning(false);
              gameEngine.stop();
              setDifficulty(DIFFICULTY.EASY);
              break;
            case "new_point":
              setCurrentPoints(currentPoints + 1);
              break;
          }
        }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <StatusBar style="auto" hidden={true} />
      </GameEngine>

      {!running ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: "red",
              fontSize: 30,
              backgroundColor: "white",
            }}
          >
            Hi Freddies!
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "blue",
              paddingHorizontal: 30,
              paddingVertical: 10,
              marginVertical: 10,
            }}
            onPress={() => {
              setCurrentPoints(0);
              setRunning(true);
              gameEngine.swap(entities(difficulty));
            }}
          >
            <Text style={{ fontWeight: "bold", color: "white", fontSize: 30 }}>
              START GAME
            </Text>
          </TouchableOpacity>
          <Leaderboard />
        </View>
      ) : null}
    </View>
  );
}

const Leaderboard = () => {
  const leaders = [
    ["Mathias & Colt & Piper", 3], // 1st grade
    // ["Zac*", 9], // 3rd grade
    // ["Mason & O. Stryker", 8], // 3rd grade
    // ["Ryan", 7], // 5th grade
  ];

  return leaders.map(([name, score], i) => (
    <Text
      key={name}
      style={{
        fontWeight: "bold",
        color: "white",
        fontSize: 30,
        backgroundColor: "black",
        padding: 5,
      }}
    >
      {i === 0 ? "High" : ""} Score: {name} ({score})
    </Text>
  ));
};

const entities = (difficulty) => {
  let engine = Matter.Engine.create({ enableSleeping: false });

  let world = engine.world;

  world.gravity.y = 0.5;

  const pipeSizePosA = getPipeSizePosPair(0, difficulty.gap);
  const pipeSizePosB = getPipeSizePosPair(windowWidth * 0.9, difficulty.gap);
  return {
    physics: { engine, world },

    Bird: Bird(world, "green", { x: 50, y: 300 }, { height: 40, width: 40 }),

    ObstacleTop1: Obstacle(
      world,
      "ObstacleTop1",
      "red",
      pipeSizePosA.pipeTop.pos,
      pipeSizePosA.pipeTop.size
    ),
    ObstacleBottom1: Obstacle(
      world,
      "ObstacleBottom1",
      "blue",
      pipeSizePosA.pipeBottom.pos,
      pipeSizePosA.pipeBottom.size
    ),

    ObstacleTop2: Obstacle(
      world,
      "ObstacleTop2",
      "red",
      pipeSizePosB.pipeTop.pos,
      pipeSizePosB.pipeTop.size
    ),
    ObstacleBottom2: Obstacle(
      world,
      "ObstacleBottom2",
      "blue",
      pipeSizePosB.pipeBottom.pos,
      pipeSizePosB.pipeBottom.size
    ),

    Floor: Floor(
      world,
      "green",
      { x: windowWidth / 2, y: windowHeight },
      { height: 50, width: windowWidth }
    ),
  };
};

const Physics =
  (difficulty) =>
  (entities, { touches, time, dispatch }) => {
    let engine = entities.physics.engine;

    touches
      .filter((t) => t.type === "press")
      .forEach((t) => {
        Matter.Body.setVelocity(entities.Bird.body, {
          x: 0,
          y: difficulty.jumpHeight,
        });
      });

    Matter.Engine.update(engine, time.delta);

    for (let index = 1; index <= 2; index++) {
      if (
        entities[`ObstacleTop${index}`].body.bounds.max.x <= 50 &&
        !entities[`ObstacleTop${index}`].point
      ) {
        entities[`ObstacleTop${index}`].point = true;
        dispatch({ type: "new_point" });
      }

      if (entities[`ObstacleTop${index}`].body.bounds.max.x <= 0) {
        const pipeSizePos = getPipeSizePosPair(
          windowWidth * 0.9,
          difficulty.gap
        );

        Matter.Body.setPosition(
          entities[`ObstacleTop${index}`].body,
          pipeSizePos.pipeTop.pos
        );
        Matter.Body.setPosition(
          entities[`ObstacleBottom${index}`].body,
          pipeSizePos.pipeBottom.pos
        );

        entities[`ObstacleTop${index}`].point = false;
      }

      Matter.Body.translate(entities[`ObstacleTop${index}`].body, {
        x: -3,
        y: 0,
      });
      Matter.Body.translate(entities[`ObstacleBottom${index}`].body, {
        x: -3,
        y: 0,
      });
    }

    Matter.Events.on(engine, "collisionStart", (event) => {
      dispatch({ type: "game_over" });
    });
    return entities;
  };
