<script>
  import Map from "../components/Map.svelte";
  import Thumbnail from "../components/Thumbnail.svelte";
  import { makeTitle } from "../view";
</script>

<style>
  h1,
  h2 {
    margin: 0;
  }

  section {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 10px;
  }

  section div {
    flex-basis: 400px;
    flex-grow: 1;
  }

  img {
    width: 400px;
    max-width: 100%;
    margin: 5px;
    flex-shrink: 0;
  }
</style>

<svelte:head>
  <title>{makeTitle('Join us')}</title>
</svelte:head>

<h1>Join CUCB</h1>

<section>
  <div>
    <p>
      You might never have played folk music before, Celtic or otherwise, or you might have grown up with it, but either
      way you'll enjoy the CUCB. We are a very friendly, non-audition, non-commitment band - check out the rest of this
      page, and
      <a href="/faqs/join/">the FAQs we answered for you</a>
      , to learn more about what we do.
    </p>
    <p>
      The style of playing is more informal than some other genres (like orchestral music), and we have workshops
      throughout the year where you can learn about playing traditional music.
    </p>
    <p>
      Naturally, a lot of our members play instruments typical of folk music, such as fiddle (violin), flute and guitar,
      but the band is certainly not limited to these, and almost anything is welcome - feel free to ask. (We have
      saxophones, cellos, trombones, recorders, accordions, banjos, and much much more - even a wind synthesiser!)
    </p>
  </div>
  <img
    src="/images/join/rehearsal.jpg"
    alt="Several people sitting in a semicircle around the President, playing instruments"
  />
  <p>
    We rehearse every Thursday of term-time from 8pm to 10pm, usually in Emmanuel United Reform Church. We've provided a
    map, but do check any e-mails from the official list before turning up in case of a change of venue.
  </p>
  <Map
    title="Map showing location of Emmanuel United Reform Church"
    src="https://maps.google.com/maps?f=q&source=s_q&hl=en&geocode=&q=Emmanuel+URC+Church,+Trumpington+Street,+Cambridge,+UK&aq=0&oq=emma&sll=37.0625,-95.677068&sspn=62.870523,135.263672&ie=UTF8&hq=Emmanuel+URC+Church,&hnear=Trumpington+St,+Cambridge,+United+Kingdom&t=m&ll=52.204267,0.120163&spn=0.012098,0.023603&z=15&iwloc=A&output=embed"
  />
</section>

<h2>Gigs</h2>

<section>
  <div>
    <p>
      We play for ceilidhs [kay-lees] throughout the year. These are fun social dances to traditional Scottish and Irish
      folk tunes. We provide the music and a caller to instruct the dancers, and the crowd goes wild.
    </p>
    <p>
      Our gigs cover a variety of occasions such as: student ceilidhs, birthday parties, weddings and charity events.
      All the money earned goes in a big pot, and is spent on social events and our annual tour.
    </p>
    <p>
      In each gig we have a line-up of up to ten people - you can volunteer to play in as many or as few as you want.
      It's easy and fun to play at a gig, so don't be afraid to sign up.
    </p>
  </div>

  <img src="/images/join/whitworth.jpg" alt="One of our ceilidhs" />
</section>

<h2>Socials</h2>

<section>
  <div>
    <p>
      We get up to a lot more than just playing music in the Ceilidh Band. Each rehearsal is followed by an informal pub
      trip. Some people carry on the tunes with a
      <a href="/session/">session</a>
      , whilst others just like to have a drink and a chat.
    </p>
    <p>We have several socials each term, all of which are either free or subsidised by the band, including:</p>
    <ul>
      <li>Freshers' Formal</li>
      <li>Band dinners</li>
      <li>Ceilidh Band Sports Day</li>
      <li>Pub trips</li>
      <li>Ceilidh Band Ceilidhs, where we take turns to play and dance</li>
      <li>Black-tie Annual Dinner</li>
      <li>May Week Garden Party</li>
    </ul>
  </div>

  <img src="/images/join/annual-dinner-2013.jpg" alt="Annual dinner 2013" />
</section>

<p>
  Some of our money gets spent on our Annual Tour every September. Recent destinations include: Callander, the Lake
  District, and the Peak District. More can be read on the
  <a href="/members/tour/">tour page</a>
  .
</p>
<p>
  If you are interested, feel free to join our
  <a href="/mailinglists/">mailing list</a>
  or
  <a href="/committee/">contact a member of the committee</a>
  . We look forward to seeing you at a rehearsal sometime soon.
</p>

<h2>Band Pics!</h2>
<p>Our thanks to Amelia Penny, Tom Furnival, Zhao Songyuan, Danielle Ainsworth and many others for all the photos!</p>

<section>
  <Thumbnail
    src="/images/join/Alumni_Dinner.jpg"
    description="The Alumni Dinner - members past and present reunited!"
  />
  <Thumbnail
    src="/images/join/Annual_Dinner_2012_Instruments.jpg"
    description="One of the more unusual instruments owned by the band..."
  />
  <Thumbnail
    src="/images/join/Annual_Dinner_Presents.jpg"
    description="The 2014 Annnual Dinner - presents for the old committee"
  />
  <Thumbnail src="/images/join/Annual_Dinner_Session_Mix.jpg" description="Tunes!" />
  <Thumbnail src="/images/join/Session_2010_Fliss.jpg" description="Sessions can be *this* fun" />
  <Thumbnail src="/images/join/Tour2012-Group.jpg" description="Band on tour, 2012" />
  <Thumbnail src="/images/join/Tour2012-Session_Outside.jpg" description="A session on tour, 2012" />
</section>
