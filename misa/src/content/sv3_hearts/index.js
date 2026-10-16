// Relationship Depth (sv3_hearts): extra heart events for the cast, Best Friend perks, group hangouts, the friendship web,
// town dramas, letters from the future, Friend Circle, Heart Archive and handmade gifts. See core.js for the save slice.
import { features } from '../../core/registry.js';
import './core.js';
import './cast_a.js';
import './cast_b.js';
import './cast_c.js';
import './groups.js';
import './web.js';
import './gifts.js';
import './ui.js';

features('Relationships Deep', [
  'Kai at 5 hearts: puddle penalties on a rainy afternoon (rain only); at 10 hearts the Best Friend scene on the floodlit field, with the Sprint Drill or the Second Wind routine',
  'Suzu at 5 hearts: the Detective Agency game in the library when you carry a mystery novel; at 10 hearts the secret shelf, with a Library Card of Honour or Story Lessons',
  'Rina at 5 hearts: a violin and reading duet in the music corridor (with Suzu around); at 10 hearts the old ranking board, with her study method or her poise lessons',
  'Theo at 5 hearts: leaf songs in the autumn park; at 10 hearts the dusk painting on the school roof, with the steady line or an eye for value',
  'Hina at 5 hearts: the snail parade in the rain; at 10 hearts her hidden lab, with the bug whisperer secret or her green-thumb recipe',
  'Ms. Fujita at 5 hearts: the comet logbook in the library archive when you carry the Star Atlas; at 10 hearts a night on the roof, with study notes or shooting-star wishes',
  'Mr. Ogawa at 5 hearts: roasting yaki-imo behind the greenhouse in autumn; at 10 hearts a walk round the track, with his training regime or his champion tomato method',
  'Grandma Hana at 5 hearts: snow lanterns in the Sunny Pines garden on snowy or winter days; at 10 hearts the list of things that stay, with the Keeper\'s Blessing or the Lantern Light',
  'Tobias at 5 hearts: a candlelit clock repair during a storm; at 10 hearts the brass key in the clock tower, with apprentice rates or fine-work lessons',
  'Mika at 5 hearts: a strawberry test batch in the kitchen when you carry a strawberry; at 10 hearts Kumo-chan\'s first cup, with a staff discount or kitchen secrets',
  'Sachiko at 5 hearts: the Summer Sale Day rush at Sunny Mart; at 10 hearts the back room and Hana\'s photograph, with family prices or the coupon queen\'s book',
  'Captain Jun at 5 hearts: the autumn squid run on the pier at dusk; at 10 hearts a dawn on the Sayori, with the Bite Whisper or the harbour price list',
  'Kiko at 5 hearts: the pudding offering when you carry the limited mango pudding; at 10 hearts the keeper\'s bond on the lookout, with a lucky charm or a Player Two charm',
  'Pip at 5 hearts: chasing forty-one scattered letters on a windy day; at 10 hearts the back-room ceremony, with Friday overtime tips or the Fast Lane shortcuts',
  'Mr. Hayashi at 5 hearts: Seedling Day on the lane in spring; at 10 hearts the rose corner, with his compost secret or his market wisdom',
  'Every new scene runs 14 to 20 steps with a choice that sets a soc3 flag and changes friendship, and the thank-you notes arrive by mail',
  'Hearts do not stop mattering at 8: every cast member now has two more scenes to look forward to, with the 10-heart capstone unique to each person',
  'Scenes record their choices so the Heart Archive and the friends\' later conversations can recall them',
]);
