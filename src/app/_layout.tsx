import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { SQLiteProvider, deleteDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { openCatalog } from "../catalog";
import { loadMeta } from "../meta";
import { UpdateProgress, checkForUpdate } from "../update";
import { useStore } from "../store";
import { useColors } from "../theme";

// Bump the number when the catalogue changes: the file is only copied if that name is missing.
const CATALOG = "catalog-2.db";

// Must stay outside the component: SQLiteProvider reopens the database whenever this function
// changes, and a reopen during the first-launch copy reads a half-written file.
async function init(db: SQLiteDatabase) {
  try {
    openCatalog(db);
    loadMeta();
  } catch (e) {
    // The first-launch copy isn't atomic. Drop a broken file so the next launch copies it again.
    await db.closeAsync();
    await deleteDatabaseAsync(CATALOG);
    throw e;
  }
}

export default function Root() {
  const c = useColors();
  const { theme } = useStore();
  const [failed, setFailed] = useState(false);
  useEffect(() => { SystemUI.setBackgroundColorAsync(c.bg); }, [c.bg]);
  useEffect(checkForUpdate, []);

  const bg = { flex: 1, backgroundColor: c.bg };
  if (failed) {
    return (
      <View style={[bg, { justifyContent: "center", padding: 32 }]}>
        <Text style={{ color: c.text, fontSize: 17, lineHeight: 24 }}>
          The video catalogue couldn't be opened. Close and reopen the app to try again.
        </Text>
      </View>
    );
  }
  return (
    <View style={bg}>
      <StatusBar style={theme === "system" ? "auto" : theme === "dark" ? "light" : "dark"} />
      <SQLiteProvider
        databaseName={CATALOG}
        assetSource={{ assetId: require("../../assets/catalog.db") }}
        onInit={init}
        onError={(e) => { console.error("catalogue", e); setFailed(true); }}
      >
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
      </SQLiteProvider>
      <UpdateProgress />
    </View>
  );
}
