function IncludeSource()
{
echo "" >> ../trekgame.js
echo "" >> ../trekgame.js
echo "// ------- $1 ------- ">> ../trekgame.js
cat $1 >> ../trekgame.js
}

cd source

# create the file
echo "// TrekGame.js" > ../trekgame.js
echo "// Generated on $(date)" >> ../trekgame.js
echo "// Making Games By Year, Episode 1" >> ../trekgame.js
echo "// Script generated megafile from individual .js files" >> ../trekgame.js
echo "// Do not edit this file, edit individual scripts in the source dir and re-run compile.sh" >> ../trekgame.js

IncludeSource globals.js
IncludeSource util.js
IncludeSource Grid.js
IncludeSource GameObject.js
IncludeSource StarBase.js
IncludeSource Klingon.js
IncludeSource Star.js
IncludeSource Enterprise.js
IncludeSource Quadrant.js
IncludeSource GalaxyMap.js
IncludeSource Menu.js
IncludeSource MainMenu.js
IncludeSource TrekGame.js

