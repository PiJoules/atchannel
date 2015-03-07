# Bugs
Some bugs I found that need 3 be fixed.

## Major
- **Different browser loading times**
  - Up until yesterday, this was tested entirely on Chrome. After checking it out on Safari and Firefox, a few bugs were found and solved. While Chrome operates similarly to Firefox in terms of loading messages, Safari tends to load more messages in small increments (0,1,27,45,...,145) instead of almost all at once like Chrome or Firefox (0,145).

## Minor
- **Close Auto-incermenting**
  - Two posts that are sent at (almost) the same time may not have the same order as expected. For example, if post A is sent maybe a few milliseconds before post B, and assuming no one else in the world posts within this timeframe, then it should be expected for post A to have postNumber 'n' with time 't' and for post B to have postNumber 'n+1' and time 't+(a few milliseconds)'. However, on a rare instance, post B will set the auto-incrementor off first and have a postNumber of 'n' instead of 'n+1', leaving post A with a postNumber of 'n+1' and a time of 't'. As a result, post A will appear before post B in the feed, but with swicthed postNumbers.
- **Scrolling**
  - Compared to Chrome and Safari, scrolling seems to be more blocky in Firefox. In general, scrolling also seems more blocky on my PC than my Mac.
