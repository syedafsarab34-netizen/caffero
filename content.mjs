const pexels = (id, width = 1400) => "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=" + width;

export const seedContent = [
  {
    collection: "methods",
    items: [
      {
        slug: "french-press", title: "French press", subtitle: "The slow, full-bodied classic",
        description: "A hands-off immersion brew with a rounded, velvety body and room for a coffee’s natural sweetness to linger.",
        image: pexels("22608922"), imageAlt: "A freshly prepared cup of coffee, photographed in the warm light of morning.",
        data: {
          difficulty: "Easy", time: "4 min", ratio: "1:15", grind: "Coarse · like sea salt", temperature: "93°C / 200°F",
          dose: "30 g", yield: "450 ml", coffee: "A fresh medium roast with chocolate, caramel or stone-fruit notes.", equipment: ["French press", "Burr grinder", "Digital scale", "Timer", "Kettle"],
          steps: [
            { title: "Warm the press", text: "Rinse the glass with hot water, then discard it. A warm vessel keeps the brew temperature steady.", duration: "30 sec" },
            { title: "Grind and add coffee", text: "Grind 30 g of coffee as evenly as you can to a coarse, sea-salt-like texture. Add it to the empty press.", duration: "30 sec" },
            { title: "Pour and bloom", text: "Start your timer. Pour 450 ml of water just off the boil over all the grounds. Give the brew one gentle stir.", duration: "30 sec" },
            { title: "Let it steep", text: "Set the lid on top with the plunger raised. Leave the coffee untouched until the timer reaches four minutes.", duration: "4 min" },
            { title: "Press and pour", text: "Press the plunger slowly and evenly, then pour every cup straight away. Coffee left in the press keeps extracting.", duration: "30 sec" }
          ],
          mistakes: ["Grinding too fine can make the cup muddy and bitter.", "Pressing quickly agitates the grounds and leaves a gritty finish.", "Leaving the coffee in the press after brewing makes each sip stronger and harsher."],
          tips: ["For an even cleaner cup, wait an extra minute before pressing and pour slowly.", "Adjust one variable at a time: grind size first, then time.", "Use filtered water that tastes good on its own."],
          faq: [{ q: "Can I press coffee straight away?", a: "A slow, even press around the four-minute mark keeps agitation down. There is no need to force it." }]
        }
      },
      {
        slug: "moka-pot", title: "Moka pot", subtitle: "A little Italian stove-top ritual",
        description: "A compact stove-top brewer that creates a bold, concentrated cup without an espresso machine.",
        image: pexels("14792389"), imageAlt: "Moka pot, coffee grounds and a small cup in warm indoor light.",
        data: {
          difficulty: "Easy", time: "5–7 min", ratio: "1:10", grind: "Medium-fine · finer than drip", temperature: "Hot water in the base",
          dose: "18 g", yield: "180 ml", coffee: "A chocolatey medium or medium-dark roast that tastes good without milk.", equipment: ["Moka pot", "Kettle", "Burr grinder", "Kitchen towel"],
          steps: [
            { title: "Heat fresh water", text: "Boil fresh water in a kettle. Fill the bottom chamber to just below the pressure valve.", duration: "1 min" },
            { title: "Fill the basket", text: "Grind 18 g to a medium-fine texture. Fill the basket evenly, then level the coffee. Do not tamp it.", duration: "30 sec" },
            { title: "Assemble carefully", text: "Place the basket in the warm base and screw on the top. Use a towel to hold the hot base safely.", duration: "20 sec" },
            { title: "Brew over low heat", text: "Leave the lid open and set the pot over low to medium heat. Coffee should emerge as a steady, gentle stream.", duration: "3–5 min" },
            { title: "Stop at the first hiss", text: "When the stream turns pale and you hear a soft gurgle, remove the pot from heat and cool the base under water.", duration: "10 sec" }
          ],
          mistakes: ["Never tamp the basket; compacted grounds can obstruct flow.", "High heat makes the coffee taste harsh and scorched.", "Waiting for a long, sputtering hiss means the coffee has extracted too far."],
          tips: ["Pre-heated water shortens time on the stove and keeps the finished cup tasting sweeter.", "Use a medium-fine grind, a little coarser than espresso.", "A moka pot makes concentrated coffee; add hot water or warm milk to soften it."],
          faq: [{ q: "Is moka-pot coffee espresso?", a: "No. It brews with much lower pressure than an espresso machine, producing a concentrated cup with its own texture and character." }]
        }
      },
      {
        slug: "espresso", title: "Espresso", subtitle: "A small cup with a lot to say",
        description: "Finely ground coffee, carefully balanced pressure and a short extraction make this expressive little foundation for countless drinks.",
        image: pexels("16466219"), imageAlt: "Espresso pouring from a coffee machine into a white cup.",
        data: {
          difficulty: "Confident", time: "25–32 sec", ratio: "1:2", grind: "Fine · table salt", temperature: "92–96°C / 198–205°F",
          dose: "18 g", yield: "36 g", extraction: "25–32 sec", coffee: "Fresh beans with a roast date in the last month. Start with a balanced espresso roast.", equipment: ["Espresso machine", "Burr grinder", "18 g basket", "Scale and timer", "Tamper"],
          steps: [
            { title: "Warm and rinse", text: "Warm the portafilter and cup. Run a short blank shot through the group head to rinse it.", duration: "20 sec" },
            { title: "Grind a measured dose", text: "Weigh 18 g of beans and grind fine, directly into the portafilter. Work promptly after grinding.", duration: "20 sec" },
            { title: "Distribute and tamp", text: "Settle the grounds evenly across the basket, then press straight down with firm, level pressure.", duration: "15 sec" },
            { title: "Pull your shot", text: "Lock in the portafilter and start the shot. Stop when the scale reads 36 g; aim for 25–32 seconds.", duration: "25–32 sec" },
            { title: "Taste, then adjust", text: "Take a sip. If it runs fast and tastes sour, grind finer. If slow and bitter, grind coarser. Change one thing at a time.", duration: "1 min" }
          ],
          mistakes: ["Changing dose, grind and yield together makes dial-in harder to understand.", "Uneven distribution can cause channels and inconsistent shots.", "Old beans lose sweetness and make it harder to pull a satisfying shot."],
          tips: ["Use a scale: dose and yield reveal more than the crema alone.", "The 1:2 recipe is a starting place. Shape the shot to make the coffee taste balanced.", "Let the machine and portafilter warm fully before judging a shot."],
          faq: [{ q: "Why is my espresso sour?", a: "A sour shot often needs a slightly finer grind or a longer yield. Change one variable, pull again and taste." }]
        }
      },
      {
        slug: "aeropress", title: "AeroPress", subtitle: "A bright, easy cup with a gentle press",
        description: "A compact brewer that pairs short immersion with a paper filter for a clean, sweet cup. It travels easily, forgives small changes and rewards a calm, even press.",
        image: pexels("22129725"), imageAlt: "A freshly prepared AeroPress-style coffee served beside a home brewing setup.",
        data: {
          difficulty: "Easy to learn", time: "2 min", ratio: "1:15", grind: "Medium-fine · finer than table salt", temperature: "92–94°C / 198–201°F",
          dose: "15 g", yield: "225 ml", coffee: "A fresh light or medium roast with fruit, caramel or chocolate notes. Paper filtration keeps the cup clean and expressive.", equipment: ["AeroPress brewer", "Paper micro-filter", "Mug or server", "Burr grinder", "Digital scale", "Kettle"],
          steps: [
            { title: "Set up and rinse", text: "Place a paper filter in the cap, rinse it with hot water and attach the cap. Stand the AeroPress on a sturdy mug, with the plunger removed.", duration: "20 sec" },
            { title: "Grind and add coffee", text: "Weigh 15 g of coffee and grind to a medium-fine texture. Add the grounds to the chamber and gently level the bed.", duration: "30 sec" },
            { title: "Pour and stir", text: "Start your timer and add 225 g of water at 92–94°C. Pour steadily to wet all the grounds, then stir gently for about ten seconds.", duration: "30 sec" },
            { title: "Steep a little", text: "Place the plunger into the chamber just far enough to create a seal. Let the coffee steep until the timer reaches 1 minute 30 seconds.", duration: "1 min" },
            { title: "Press slowly", text: "Hold the mug and press down gently and evenly. Stop when you hear a soft hiss; there is no need to force the last air through.", duration: "30 sec" }
          ],
          mistakes: ["Pressing hard can push extra fines into the cup; use a gentle, steady press.", "Very hot water and a very fine grind can make a short brew taste harsh.", "If the seal feels stuck, stop pressing and check the brewer rather than forcing it."],
          tips: ["The standard, upright method is simple and beginner-friendly; there is no need to start inverted.", "A little stirring helps wet the bed evenly. Keep it gentle so the cup stays clean.", "Try a slightly finer grind for a thin cup or a longer steep for more body, changing one thing at a time."],
          faq: [{ q: "Do I need to brew AeroPress upside down?", a: "No. The standard upright method is stable and easy to learn. The plunger creates a seal that slows dripping while the coffee steeps." }, { q: "How hard should I press?", a: "Use light, even pressure for around 20–30 seconds. If it takes a lot of force, stop and check that the grind is not too fine." }]
        }
      },
      {
        slug: "pour-over", title: "Pour-over", subtitle: "Clarity, one pour at a time",
        description: "A paper-filter brew that rewards an even grind and an unhurried, steady pour with a clean, expressive cup.",
        image: pexels("22129725"), imageAlt: "A pour-over coffee setup ready for a careful morning brew.",
        data: {
          difficulty: "Some practice", time: "3 min", ratio: "1:16", grind: "Medium · table salt", temperature: "94°C / 201°F",
          dose: "20 g", yield: "320 ml", coffee: "A light or medium roast with fruit or floral notes.", equipment: ["Pour-over dripper", "Paper filter", "Gooseneck kettle", "Scale", "Server"],
          steps: [
            { title: "Rinse your filter", text: "Set the paper filter in the dripper and wet it with hot water. Empty the rinse water from your server.", duration: "20 sec" },
            { title: "Add fresh grounds", text: "Grind 20 g of coffee to a medium texture. Add it to the filter and gently level the bed.", duration: "20 sec" },
            { title: "Bloom", text: "Pour 50 g of water over all the grounds and wait for the coffee to release its first aromas.", duration: "30 sec" },
            { title: "Pour in slow circles", text: "Pour gently from the center outward in small circles, bringing the total water weight to 320 g.", duration: "1–2 min" },
            { title: "Let it drain", text: "Wait for the bed to finish draining. A total brew time near three minutes is a useful first target.", duration: "30 sec" }
          ],
          mistakes: ["Pouring only in the center leaves some grounds dry.", "Very fast pours disturb the bed; keep the stream gentle.", "A very fine grind can slow drainage and taste dry or bitter."],
          tips: ["A gooseneck kettle makes a slow, controlled pour easier.", "Preheat the brewer and rinse away the filter's paper taste.", "Change the grind only a small amount between brews."],
          faq: [{ q: "What grind do I need for pour-over?", a: "Medium is a reliable place to start, like table salt. Adjust slightly finer for a thin, fast cup, or coarser for a slow, bitter one." }]
        }
      },
      {
        slug: "cold-brew", title: "Cold brew", subtitle: "Slow, cool and quietly sweet",
        description: "Time does the heavy lifting: steep coarse coffee in cool water for an easy-to-dilute concentrate with mellow edges.",
        image: pexels("7488694"), imageAlt: "Iced coffee served in warm morning light.",
        data: {
          difficulty: "Easy", time: "12–16 hr", ratio: "1:8 concentrate", grind: "Extra coarse", temperature: "Cold, filtered water",
          dose: "80 g", yield: "640 ml", coffee: "A medium or dark roast with chocolate or nut notes.", equipment: ["Lidded jar", "Burr grinder", "Digital scale", "Fine sieve or paper filter"],
          steps: [
            { title: "Grind extra coarse", text: "Weigh 80 g of fresh coffee and grind quite coarsely, a little larger than for a French press.", duration: "1 min" },
            { title: "Combine coffee and water", text: "Place grounds in a clean jar. Add 640 ml of cold filtered water and stir until all grounds are wet.", duration: "1 min" },
            { title: "Cover and steep", text: "Cover the jar and steep in the refrigerator for 12 to 16 hours. Taste it at 12 hours to find your preference.", duration: "12–16 hr" },
            { title: "Strain patiently", text: "Pour through a fine mesh sieve. For a cleaner cup, strain a second time through a paper filter.", duration: "3 min" },
            { title: "Pour over ice", text: "Dilute one part concentrate with one part water or milk. Keep the rest covered and refrigerated.", duration: "1 min" }
          ],
          mistakes: ["Finer grounds make cold brew muddy and difficult to strain.", "Steeping for far too long can leave a woody, drying flavor.", "Forgetting to dilute the concentrate leads to an unnecessarily intense cup."],
          tips: ["Taste a spoonful before adjusting the brew. Small differences in beans change the ideal steep.", "Write the date on your jar and enjoy within a week.", "You can dilute with still water, sparkling water or milk."],
          faq: [{ q: "Does cold brew need to stay in the fridge?", a: "Steeping in the refrigerator gives you a steady, easy-to-repeat recipe. Cover the finished brew and keep it chilled." }]
        }
      }
    ]
  },
  {
    collection: "articles",
    items: [
      {
        slug: "what-is-coffee", title: "Coffee, from seed to sip", subtitle: "A small seed with a very long journey.",
        description: "Coffee begins as the seed inside a fruit. Meet the plant, people and choices that shape the cup you drink.",
        image: pexels("7488694"), imageAlt: "A freshly made cup on a slow, quiet morning.",
        data: { readTime: "5 min", category: "The bean", level: "Curious beginner", sections: [
          { heading: "Coffee is a fruit", text: "Coffee beans are the seeds inside the bright red fruit of Coffea plants. Most coffee grows in tropical regions where altitude and distinct seasons make for slow-ripening cherries." },
          { heading: "A little seed travels a long way", text: "After a farmer harvests ripe cherries, the seeds are separated, dried and sorted. Roasters apply heat to reveal flavors that can remind you of chocolate, stone fruit, nuts or flowers." },
          { heading: "A cup made by many hands", text: "Every drink reflects decisions made at the farm, during processing, at the roastery and at your own brewer. Learning how one choice changes the taste is half the fun." }
        ] }
      },
      {
        slug: "arabica-vs-robusta", title: "Arabica & robusta", subtitle: "Two familiar coffee species, each with something different to offer.",
        description: "Learn how coffee species differ in flavor, growing conditions and caffeine—and why the label alone never tells the whole story.",
        image: pexels("22608922"), imageAlt: "A warm, quiet cup of coffee.",
        data: { readTime: "4 min", category: "The bean", level: "Coffee curious", sections: [
          { heading: "Arabica", text: "Arabica is often celebrated for its delicate sweetness and range of fruit, floral and chocolate notes. Its flavor is shaped by where it grows, how the cherries are processed and how the beans are roasted." },
          { heading: "Robusta", text: "Robusta plants are hardier and commonly produce beans with more caffeine, a fuller body and familiar earthy or cocoa notes. It can bring structure and crema to an espresso blend." },
          { heading: "Taste the cup, not just the label", text: "Both species span a range of quality and style. Harvest, farm, processing and roasting matter alongside the species. Try them side by side and follow what you enjoy." }
        ] }
      },
      {
        slug: "coffee-origins", title: "A world in every cup", subtitle: "How growing regions leave their mark on coffee.",
        description: "Altitude, sunlight, soil and local tradition all make a coffee's home part of its story.",
        image: pexels("16466219"), imageAlt: "A close-up coffee pour with deep golden tones.",
        data: { readTime: "6 min", category: "Origins", level: "Coffee curious", sections: [
          { heading: "A growing belt", text: "Most coffee thrives in the warm band around the equator. Growing altitude and day-to-night temperatures influence how slowly cherries develop and what flavors they can express." },
          { heading: "Place is a clue, not a promise", text: "An Ethiopian coffee might feel floral and citrusy; a Brazilian lot might suggest nuts or chocolate. These are tendencies, not rules. Variety, harvest and processing can tell another story." },
          { heading: "Follow the harvest", text: "A thoughtful label includes origin, harvest or roast date and the producer or cooperative when that information is available. Traceability connects your coffee to the people who grew it." }
        ] }
      },
      {
        slug: "roast-levels", title: "Light, medium & dark roast", subtitle: "Roast changes the bean. Your taste decides what happens next.",
        description: "Understand roast level, color, flavor and how to choose beans that suit your brewer.",
        image: pexels("14792389"), imageAlt: "Dark roasted coffee and brewing equipment on a wooden surface.",
        data: { readTime: "5 min", category: "Roasting", level: "All levels", sections: [
          { heading: "The roaster's choices", text: "Green coffee changes color and aroma as it heats. A lighter roast tends to preserve more of the bean's original character. Longer roasting tends to bring deeper caramel, cocoa and toasted flavors." },
          { heading: "Roast labels are a guide", text: "There is no single, international scale for light, medium or dark. Look for the roaster's tasting notes and choose the description that sounds most appealing." },
          { heading: "Try a matched pair", text: "Brew the same method twice with a light and a medium roast. Keep the recipe steady and notice how sweetness, acidity and body change in your cup." }
        ] }
      },
      {
        slug: "coffee-processing", title: "From cherry to green bean", subtitle: "Processing shapes how coffee's sweetness and texture show up in your cup.",
        description: "Meet washed, natural and honey coffee processing, and learn what each method means on a bag of beans.",
        image: pexels("22129725"), imageAlt: "A careful coffee brewing ritual.",
        data: { readTime: "5 min", category: "Processing", level: "Coffee curious", sections: [
          { heading: "Washed", text: "Washed coffee is pulped, fermented and rinsed before drying. It often tastes clear and vivid, allowing origin or variety character to come forward." },
          { heading: "Natural", text: "Natural processing dries the coffee cherry with its fruit still around the seed. It can bring a rounder sweetness and berry-like fruit. Clean, careful drying matters." },
          { heading: "Honey and everything between", text: "Honey processing leaves some of the sticky fruit on the seed as it dries. Producers choose methods to suit the crop and climate, and the flavor is as diverse as the farms." }
        ] }
      },
      {
        slug: "grind-size-guide", title: "The right grind, found", subtitle: "A grinder is your quietest recipe tool.",
        description: "From extra coarse to espresso-fine: understand grind size, matching it to a brewer and making small adjustments.",
        image: pexels("2748538"), imageAlt: "Ground coffee ready for a home-brewing ritual.",
        data: { readTime: "6 min", category: "Brew better", level: "All levels", sections: [
          { heading: "Think about contact time", text: "Water and coffee interact while brewing. Finely ground particles offer more surface area and extract faster. Coarse grounds extract more slowly and are easier to filter from immersion brews." },
          { heading: "Start with the brewer", text: "Use coarse grounds for French press, medium grounds for most filter brewers, medium-fine for a moka pot and fine for espresso. It is a starting point, not a fixed rule." },
          { heading: "Dial in by taste", text: "A hollow, sharp cup can improve with a slightly finer grind. A dry, overly bitter cup might need a coarser grind. Change one small step and taste again." }
        ] }
      },
      {
        slug: "better-water", title: "The unsung ingredient: water", subtitle: "A better brew often begins at the tap.",
        description: "Water makes up nearly the whole cup. A few simple choices can bring out a coffee's sweetness.",
        image: pexels("22884699"), imageAlt: "Water poured into a cup beside fresh coffee beans.",
        data: { readTime: "4 min", category: "Brew better", level: "All levels", sections: [
          { heading: "Taste your water first", text: "If tap water smells strongly of chlorine or tastes unpleasant, that character may follow you into the cup. A simple carbon filter can soften those aromas." },
          { heading: "Avoid distilled water", text: "Very low-mineral distilled or reverse-osmosis water can lead to flat tasting brews. Most households can start with clean, fresh drinking water." },
          { heading: "Start with a normal kettle", text: "A thermometer can help, but it is not essential. For filter or immersion coffee, water just off a full boil is a simple, repeatable starting point." }
        ] }
      },
      {
        slug: "coffee-water-ratios", title: "The coffee-to-water ratio", subtitle: "A scale turns a good cup into one you can make again.",
        description: "Learn what 1:15 means, find a sensible starting point and use our calculator to scale your next brew.",
        image: pexels("14792389"), imageAlt: "Coffee grounds ready to measure before brewing.",
        data: { readTime: "4 min", category: "Brew better", level: "Beginner friendly", sections: [
          { heading: "Read a recipe like 1:15", text: "One part coffee to fifteen parts water means 20 grams of coffee for 300 grams of water. For water, 1 gram is very close to 1 milliliter." },
          { heading: "Find your starting ratio", text: "Try around 1:15 for French press, 1:16 for pour-over and approximately 1:2 as an espresso dose-to-yield ratio. Cold-brew recipes vary because most are diluted before serving." },
          { heading: "Keep your notes simple", text: "Weigh coffee and water, and write down what you liked. If a cup tastes too intense, add a little water. If too thin, use slightly more coffee next time." }
        ] }
      },
      {
        slug: "coffee-extraction", title: "Extraction, made intuitive", subtitle: "Bitter, sour or sweet? Read the cup before you change the recipe.",
        description: "A cup tastes more balanced when water dissolves enough of the coffee's aromatic compounds.",
        image: pexels("16466219"), imageAlt: "A rich espresso shot pouring into a ceramic cup.",
        data: { readTime: "5 min", category: "Brew better", level: "Curious beginner", sections: [
          { heading: "Extraction is a process", text: "When hot water meets ground coffee, it dissolves hundreds of flavor compounds. Grind size, water temperature and contact time shape how much makes it into your cup." },
          { heading: "Use taste as a compass", text: "Sharpness alone does not always mean under-extraction, and bitterness is not always the bean. Consider the whole taste: is it thin and short, or dry and lingering?" },
          { heading: "Change one variable", text: "A small grind adjustment is an easy next step. Keep the recipe mostly the same, brew again and note whether the change made the cup more enjoyable." }
        ] }
      },
      {
        slug: "caffeine-explained", title: "Caffeine, by the cup", subtitle: "There is more than one way to wake a coffee bean.",
        description: "Understand how beans, serving size and brew method contribute to the caffeine in your drink.",
        image: pexels("7488694"), imageAlt: "A small freshly brewed coffee in soft natural light.",
        data: { readTime: "4 min", category: "Coffee facts", level: "All levels", sections: [
          { heading: "The beans matter", text: "Robusta beans generally contain more caffeine by weight than arabica. Even within each species, growing conditions and bean variety matter." },
          { heading: "Concentration isn't the whole cup", text: "Espresso is more concentrated than drip coffee, but a typical espresso serving is also much smaller. Total caffeine depends on how much coffee goes into each drink." },
          { heading: "Recipes are not lab measurements", text: "A home cup's caffeine varies with beans, grams, water and the size of the serving. Think of typical figures as guides, not guarantees." }
        ] }
      },
      {
        slug: "keep-coffee-fresh", title: "Fresh coffee, happier mornings", subtitle: "Store your beans like something you look forward to.",
        description: "Protect coffee from its four greatest enemies and buy only as much as you can enjoy while it is fresh.",
        image: pexels("14792389"), imageAlt: "Fresh coffee beans beside a Moka pot.",
        data: { readTime: "4 min", category: "Coffee facts", level: "Beginner friendly", sections: [
          { heading: "Keep out air, moisture, heat and light", text: "Store beans in their sealed bag or an opaque, airtight container, away from your oven, sunny windowsill and steam." },
          { heading: "Buy thoughtfully", text: "A smaller bag with a roast date often serves a home brewer better than an oversized bag that sits open for months. Grind only what you need." },
          { heading: "Wait a few days after roasting", text: "Coffee benefits from resting briefly after roasting. The ideal rest depends on the coffee and the brewer; your nose and taste buds are useful guides." }
        ] }
      },
      {
        slug: "water-temperature", title: "Find a comfortable brew temperature", subtitle: "Near boiling is a friendlier starting point than a cold guess.",
        description: "Coffee temperature helps shape extraction, but you don't need a lab to brew a wonderful cup.",
        image: pexels("22884699"), imageAlt: "A warm stream of coffee falling into a cup.",
        data: { readTime: "3 min", category: "Brew better", level: "All levels", sections: [
          { heading: "Start just off the boil", text: "For most immersion and filter methods, water just after the bubbles settle is easy to repeat and works for many coffees." },
          { heading: "Adjust only when you have a reason", text: "If your brew is consistently thin, slightly hotter water might help. Dark roasts can feel more balanced at slightly cooler temperatures." },
          { heading: "Good coffee is about more than numbers", text: "Grind, dose, pour and freshness matter too. Change one thing at a time and let the taste tell you what helps." }
        ] }
      }
    ]
  },
  {
    collection: "types",
    items: [
      { slug: "espresso", title: "Espresso", subtitle: "Short, aromatic and the starting point for many café classics.", description: "A concentrated shot made under pressure from finely ground coffee.", image: pexels("16466219"), imageAlt: "Rich espresso flowing into a small ceramic cup.", data: { ingredients: ["Coffee", "Water"], proportion: "18 g in · about 36 g out", taste: "Intense, aromatic, full-bodied", method: "Espresso", notes: "Enjoy it on its own or let it anchor a milk or water-based drink." } },
      { slug: "americano", title: "Americano", subtitle: "Espresso opened up with hot water.", description: "Espresso with hot water for a longer cup with a satisfying roast aroma.", image: pexels("14792389"), imageAlt: "Black coffee served in a ceramic cup.", data: { ingredients: ["Espresso", "Hot water"], proportion: "1 part espresso · 2–3 parts water", taste: "Warm, balanced, gently aromatic", method: "Espresso", notes: "Pour hot water over the shot for a gentler cup with a soft layer of crema." } },
      { slug: "cappuccino", title: "Cappuccino", subtitle: "Espresso, silky milk and a soft cloud of foam.", description: "A balanced milk drink with equal parts espresso, steamed milk and airy foam.", image: pexels("17506073"), imageAlt: "A barista crafting delicate latte art in a cup.", data: { ingredients: ["Espresso", "Steamed milk", "Milk foam"], proportion: "1 part espresso · 1 part milk · 1 part foam", taste: "Rounded, creamy, gently bittersweet", method: "Espresso", notes: "Pour while the foam and warm milk are still smooth and together." } },
      { slug: "latte", title: "Latte", subtitle: "A comforting, gently sweetened espresso classic.", description: "A shot of espresso softened by silky steamed milk and a delicate layer of foam.", image: pexels("6205646"), imageAlt: "Warm milk meeting a fresh espresso in a cozy café.", data: { ingredients: ["Espresso", "Steamed milk", "A little milk foam"], proportion: "1 part espresso · 4–5 parts milk", taste: "Silky, mellow, gently sweet", method: "Espresso", notes: "A bigger cup lets the coffee and milk settle into a long, easy drink." } },
      { slug: "flat-white", title: "Flat white", subtitle: "A smaller, coffee-forward velvet texture.", description: "Espresso layered with glossy microfoam in a compact, smooth cup.", image: pexels("22608922"), imageAlt: "Fresh coffee served in a small, warm-toned cup.", data: { ingredients: ["Double espresso", "Velvety steamed milk"], proportion: "1 part coffee · 2 parts milk", taste: "Rich, smooth, distinctly coffee-first", method: "Espresso", notes: "The secret is fine, flowing microfoam rather than a tall cap of froth." } },
      { slug: "macchiato", title: "Macchiato", subtitle: "A small dot of milk against an espresso.", description: "An espresso marked with a spoonful of steamed milk or a soft cap of foam.", image: pexels("16466219"), imageAlt: "Espresso with a soft crema in a demitasse.", data: { ingredients: ["Espresso", "A spoonful of steamed milk or milk foam"], proportion: "About 1 espresso · 1 spoon of milk", taste: "Bold, aromatic, lightly softened", method: "Espresso", notes: "A macchiato offers just enough milk to soften the espresso without obscuring it." } },
      { slug: "mocha", title: "Mocha", subtitle: "A little chocolate, a little coffee, a very good idea.", description: "Espresso, chocolate and steamed milk make for a rich and comfortingly familiar cup.", image: pexels("17506073"), imageAlt: "A milk drink topped with carefully poured foam.", data: { ingredients: ["Espresso", "Chocolate", "Steamed milk"], proportion: "1 espresso · 15 g chocolate · 150 ml milk", taste: "Chocolatey, creamy, espresso-led", method: "Espresso", notes: "Stir the chocolate into the hot espresso before adding milk." } },
      { slug: "cortado", title: "Cortado", subtitle: "An easy, equal partnership between coffee and milk.", description: "Espresso cut with roughly the same amount of warm, gently textured milk.", image: pexels("6205646"), imageAlt: "A measured coffee drink in a small glass.", data: { ingredients: ["Espresso", "Warm, lightly textured milk"], proportion: "1 part espresso · 1 part milk", taste: "Silky, direct, quietly sweet", method: "Espresso", notes: "Use warm milk with just a little texture, not a tall layer of foam." } },
      { slug: "cold-brew-coffee", title: "Cold brew", subtitle: "Patience and cold water make a mellow glass.", description: "Coarse coffee steeps slowly in cold water and is diluted to suit.", image: pexels("7488694"), imageAlt: "Iced black coffee with bright, clear ice.", data: { ingredients: ["Cold brew concentrate", "Water or milk", "Ice"], proportion: "1 part concentrate · 1 part water", taste: "Smooth, mellow, gently sweet", method: "Cold brew", notes: "Brew a concentrate in advance and pour it over fresh ice." } },
      { slug: "iced-coffee", title: "Iced coffee", subtitle: "Your familiar hot-brew ritual, made refreshing.", description: "Freshly brewed coffee cooled gently and served over ice for bright, refreshing flavor.", image: pexels("22884699"), imageAlt: "A glass of iced coffee beside a warm coffee pour.", data: { ingredients: ["Fresh brewed coffee", "Ice"], proportion: "Brew at full strength over ice", taste: "Crisp, refreshing, aromatic", method: "Pour-over", notes: "A slightly stronger ratio keeps the finished drink balanced as the ice melts." } }
    ]
  },
  {
    collection: "faq",
    items: [
      { slug: "french-press-grind", title: "What coffee grind should I use for French press?", subtitle: "Aim for coarse and even.", description: "A coarse grind, around the size of sea salt, is a reliable starting point. Go a little coarser if your cup is muddy or dries out on the finish." },
      { slug: "how-much-coffee", title: "How much coffee should I use?", subtitle: "Start with the brew ratio.", description: "For a French press, try 1 gram of coffee to 15 grams of water. That is 20 grams of coffee for roughly 300 ml of water. Our ratio calculator scales the recipe." },
      { slug: "water-temperature-coffee", title: "What temperature should coffee water be?", subtitle: "Hot, but forgiving.", description: "Try water just off the boil, around 92–96°C, for most filter and immersion brewers. You can start simply and change temperature later if the cup tastes unbalanced." },
      { slug: "moka-vs-espresso", title: "What is the difference between a Moka pot and espresso?", subtitle: "Both concentrate coffee, in different ways.", description: "An espresso machine brews under high pressure and produces a short, concentrated shot. A Moka pot steams water through coffee at much lower pressure and makes a fuller pot of strong coffee." },
      { slug: "coffee-too-bitter", title: "Why does my coffee taste bitter?", subtitle: "Let the recipe show you where to start.", description: "Very fine grounds, too much contact time or very hot water can increase bitterness. Try grinding a little coarser, and adjust one thing at a time." },
      { slug: "coffee-too-sour", title: "Why does my coffee taste sour?", subtitle: "A little more extraction may help.", description: "A very sour or thin cup might benefit from a finer grind or a little more contact time. Change just one variable and compare." },
      { slug: "store-coffee-beans", title: "How should I store coffee beans?", subtitle: "Protect them from air, light, heat and moisture.", description: "Keep beans sealed in their bag or an opaque airtight container, somewhere cool and dry. Grind only what you need for the brew." },
      { slug: "coffee-fresh", title: "How long do coffee beans stay fresh?", subtitle: "The roast date and storage both matter.", description: "Beans typically taste best in the weeks after roasting and being allowed to rest. Their flavor gradually softens once opened, so small bags are helpful." },
      { slug: "best-coffee-ratio", title: "What is the best coffee-to-water ratio?", subtitle: "A good starting point, not a rule.", description: "Try 1:15 for French press or 1:16 for pour-over, then adjust the strength to suit your taste." },
      { slug: "espresso-in-french-press", title: "Can I use espresso coffee in a French press?", subtitle: "Yes. Check its grind before you brew.", description: "A coffee roasted for espresso can also work in a French press. If it was ground very finely for an espresso machine, ask for a coarser grind or grind it at home." }
    ]
  }
];
